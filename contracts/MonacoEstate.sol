// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Monaco Estate — on-chain real-estate game for Base
/// @notice Every apartment is an ERC-721 token. The admin registers buildings
///         and apartments; players buy primary units with ETH or $MRT
///         (0xb200000000000000000000d8b21449ecf586c801 on Base), relist them on
///         the built-in P2P marketplace in either currency, accrue rent, vote
///         on city governance and earn 20% referral commission from the
///         spending of players they invited.
contract MonacoEstate is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─────────────────────────────── Types ───────────────────────────────

    enum Currency {
        MRT,
        ETH,
        BOTH // primary sale only: buyer picks either currency
    }

    struct Building {
        string name;
        uint32 apartmentCount;
        bool active;
    }

    struct Apartment {
        uint32 buildingId;
        uint16 floor;
        string unit;            // e.g. "Apt 1201"
        uint96 priceMRT;        // primary sale price in MRT (wei, 18 dec)
        uint96 priceETH;        // primary sale price in ETH wei
        Currency payableIn;     // which currencies the primary sale accepts
        uint96 rentPerMonthMRT; // gross rent accrued per 30 days
        uint96 costPerYearMRT;  // maintenance deducted from rent claims
        bool minted;            // sold at least once (primary sale done)
    }

    struct Listing {
        address seller;
        uint96 price;
        Currency currency;      // MRT or ETH (never BOTH)
        bool active;
    }

    struct Proposal {
        string description;
        uint64 deadline;
        uint128 votesYes;
        uint128 votesNo;
        uint128 votesAbstain;
        bool executed;
    }

    // ─────────────────────────────── Storage ─────────────────────────────

    IERC20 public immutable mrt;
    address public treasury;

    uint16 public constant REFERRAL_BPS = 2000;   // 20% of every purchase
    uint16 public constant MARKET_FEE_BPS = 200;  // 2% P2P marketplace fee
    uint96 public constant VOTES_PER_PROPERTY = 10_000 ether;
    uint64 public constant RENT_PERIOD = 30 days;

    uint32 public nextBuildingId;
    uint256 public nextApartmentId;
    uint256 public nextProposalId;

    mapping(uint32 => Building) public buildings;
    mapping(uint256 => Apartment) public apartments;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint64) public lastRentClaim;  // apartmentId → timestamp

    mapping(address => address) public referrerOf;    // player → who invited them
    mapping(address => uint256) public referralEarnedMRT;
    mapping(address => uint256) public referralEarnedETH;
    mapping(address => uint32) public referralCount;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint32) public propertiesOf;   // owned unit count

    // ─────────────────────────────── Events ──────────────────────────────

    event BuildingAdded(uint32 indexed buildingId, string name);
    event ApartmentAdded(uint256 indexed apartmentId, uint32 indexed buildingId, string unit);
    event PrimarySale(uint256 indexed apartmentId, address indexed buyer, Currency currency, uint256 price);
    event Listed(uint256 indexed apartmentId, address indexed seller, uint256 price, Currency currency);
    event ListingCancelled(uint256 indexed apartmentId);
    event ListingSold(uint256 indexed apartmentId, address indexed seller, address indexed buyer, uint256 price, Currency currency);
    event RentClaimed(uint256 indexed apartmentId, address indexed landlord, uint256 netAmount);
    event ReferralRegistered(address indexed player, address indexed referrer);
    event ReferralPaid(address indexed referrer, address indexed spender, uint256 amount, Currency currency);
    event ProposalCreated(uint256 indexed proposalId, string description, uint64 deadline);
    event Voted(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 weight);

    // ─────────────────────────────── Errors ──────────────────────────────

    error ApartmentUnknown();
    error AlreadySold();
    error WrongCurrency();
    error WrongPayment();
    error NotListed();
    error NotOwnerOfUnit();
    error SelfReferral();
    error AlreadyReferred();
    error ProposalClosed();
    error AlreadyVoted();
    error NothingToClaim();

    constructor(IERC20 mrtToken, address treasury_)
        ERC721("Monaco Estate Deed", "MED")
        Ownable(msg.sender)
    {
        mrt = mrtToken;
        treasury = treasury_;
    }

    // ─────────────────────────── Admin: catalog ──────────────────────────

    /// @notice Register a new building. New buildings/apartments can be added
    ///         any time after launch (initial city ships with 49 units).
    function addBuilding(string calldata name) external onlyOwner returns (uint32 id) {
        id = nextBuildingId++;
        buildings[id] = Building({name: name, apartmentCount: 0, active: true});
        emit BuildingAdded(id, name);
    }

    function addApartment(
        uint32 buildingId,
        uint16 floor,
        string calldata unit,
        uint96 priceMRT,
        uint96 priceETH,
        Currency payableIn,
        uint96 rentPerMonthMRT,
        uint96 costPerYearMRT
    ) external onlyOwner returns (uint256 id) {
        require(buildings[buildingId].active, "building inactive");
        id = ++nextApartmentId; // token ids start at 1
        apartments[id] = Apartment({
            buildingId: buildingId,
            floor: floor,
            unit: unit,
            priceMRT: priceMRT,
            priceETH: priceETH,
            payableIn: payableIn,
            rentPerMonthMRT: rentPerMonthMRT,
            costPerYearMRT: costPerYearMRT,
            minted: false
        });
        buildings[buildingId].apartmentCount++;
        emit ApartmentAdded(id, buildingId, unit);
    }

    function setTreasury(address treasury_) external onlyOwner {
        treasury = treasury_;
    }

    // ─────────────────────────── Referral system ─────────────────────────

    /// @notice Bind the caller to a referrer. One-time, before or after first purchase.
    function registerReferrer(address referrer) external {
        if (referrer == msg.sender || referrer == address(0)) revert SelfReferral();
        if (referrerOf[msg.sender] != address(0)) revert AlreadyReferred();
        referrerOf[msg.sender] = referrer;
        referralCount[referrer]++;
        emit ReferralRegistered(msg.sender, referrer);
    }

    function _splitMRT(address spender, uint256 amount, address seller) internal {
        address referrer = referrerOf[spender];
        uint256 commission;
        if (referrer != address(0)) {
            commission = (amount * REFERRAL_BPS) / 10_000;
            mrt.safeTransferFrom(spender, referrer, commission);
            referralEarnedMRT[referrer] += commission;
            emit ReferralPaid(referrer, spender, commission, Currency.MRT);
        }
        mrt.safeTransferFrom(spender, seller, amount - commission);
    }

    function _splitETH(address spender, uint256 amount, address seller) internal {
        address referrer = referrerOf[spender];
        uint256 commission;
        if (referrer != address(0)) {
            commission = (amount * REFERRAL_BPS) / 10_000;
            referralEarnedETH[referrer] += commission;
            _pay(referrer, commission);
            emit ReferralPaid(referrer, spender, commission, Currency.ETH);
        }
        _pay(seller, amount - commission);
    }

    function _pay(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "eth transfer failed");
    }

    // ─────────────────────────── Primary sales ───────────────────────────

    /// @notice Buy a never-sold apartment with $MRT.
    function buyWithMRT(uint256 apartmentId) external nonReentrant {
        Apartment storage apt = _primarySaleChecks(apartmentId);
        if (apt.payableIn == Currency.ETH) revert WrongCurrency();

        apt.minted = true;
        _splitMRT(msg.sender, apt.priceMRT, treasury);
        _finishPrimary(apartmentId, Currency.MRT, apt.priceMRT);
    }

    /// @notice Buy a never-sold apartment with ETH.
    function buyWithETH(uint256 apartmentId) external payable nonReentrant {
        Apartment storage apt = _primarySaleChecks(apartmentId);
        if (apt.payableIn == Currency.MRT) revert WrongCurrency();
        if (msg.value != apt.priceETH) revert WrongPayment();

        apt.minted = true;
        _splitETH(msg.sender, msg.value, treasury);
        _finishPrimary(apartmentId, Currency.ETH, msg.value);
    }

    function _primarySaleChecks(uint256 apartmentId) internal view returns (Apartment storage apt) {
        apt = apartments[apartmentId];
        if (bytes(apt.unit).length == 0) revert ApartmentUnknown();
        if (apt.minted) revert AlreadySold();
    }

    function _finishPrimary(uint256 apartmentId, Currency currency, uint256 price) internal {
        lastRentClaim[apartmentId] = uint64(block.timestamp);
        propertiesOf[msg.sender]++;
        _safeMint(msg.sender, apartmentId);
        emit PrimarySale(apartmentId, msg.sender, currency, price);
    }

    // ─────────────────────────── P2P marketplace ─────────────────────────

    /// @notice List an owned apartment for sale in MRT or ETH.
    function list(uint256 apartmentId, uint96 price, Currency currency) external {
        if (ownerOf(apartmentId) != msg.sender) revert NotOwnerOfUnit();
        if (currency == Currency.BOTH) revert WrongCurrency();
        require(price > 0, "price=0");
        listings[apartmentId] = Listing({seller: msg.sender, price: price, currency: currency, active: true});
        emit Listed(apartmentId, msg.sender, price, currency);
    }

    function cancelListing(uint256 apartmentId) external {
        Listing storage l = listings[apartmentId];
        if (!l.active || l.seller != msg.sender) revert NotListed();
        l.active = false;
        emit ListingCancelled(apartmentId);
    }

    /// @notice Buy a listed apartment. Send ETH when the listing currency is
    ///         ETH; approve MRT beforehand when it is MRT. A 2% marketplace fee
    ///         goes to the treasury and 20% referral commission is paid from
    ///         the seller-bound proceeds of the buyer's spend.
    function buyListing(uint256 apartmentId) external payable nonReentrant {
        Listing storage l = listings[apartmentId];
        if (!l.active) revert NotListed();
        address seller = l.seller;
        if (ownerOf(apartmentId) != seller) revert NotListed(); // stale listing guard
        require(seller != msg.sender, "own listing");

        uint256 price = l.price;
        uint256 fee = (price * MARKET_FEE_BPS) / 10_000;
        l.active = false;

        if (l.currency == Currency.ETH) {
            if (msg.value != price) revert WrongPayment();
            _pay(treasury, fee);
            _splitETH(msg.sender, price - fee, seller);
        } else {
            if (msg.value != 0) revert WrongPayment();
            mrt.safeTransferFrom(msg.sender, treasury, fee);
            _splitMRT(msg.sender, price - fee, seller);
        }

        propertiesOf[seller]--;
        propertiesOf[msg.sender]++;
        _transfer(seller, msg.sender, apartmentId);
        emit ListingSold(apartmentId, seller, msg.sender, price, l.currency);
    }

    // ───────────────────────────── Rent income ───────────────────────────

    /// @notice Claim accrued net rent (gross monthly rent minus pro-rata yearly
    ///         maintenance). Paid in MRT from the treasury allowance.
    function claimRent(uint256 apartmentId) external nonReentrant {
        if (ownerOf(apartmentId) != msg.sender) revert NotOwnerOfUnit();
        uint256 net = pendingRent(apartmentId);
        if (net == 0) revert NothingToClaim();
        lastRentClaim[apartmentId] = uint64(block.timestamp);
        mrt.safeTransferFrom(treasury, msg.sender, net);
        emit RentClaimed(apartmentId, msg.sender, net);
    }

    function pendingRent(uint256 apartmentId) public view returns (uint256) {
        Apartment storage apt = apartments[apartmentId];
        uint64 last = lastRentClaim[apartmentId];
        if (last == 0) return 0;
        uint256 elapsed = block.timestamp - last;
        uint256 gross = (uint256(apt.rentPerMonthMRT) * elapsed) / RENT_PERIOD;
        uint256 cost = (uint256(apt.costPerYearMRT) * elapsed) / (12 * RENT_PERIOD);
        return gross > cost ? gross - cost : 0;
    }

    // ─────────────────────────── City governance ─────────────────────────

    function createProposal(string calldata description, uint64 votingPeriod)
        external
        onlyOwner
        returns (uint256 id)
    {
        id = nextProposalId++;
        proposals[id] = Proposal({
            description: description,
            deadline: uint64(block.timestamp) + votingPeriod,
            votesYes: 0,
            votesNo: 0,
            votesAbstain: 0,
            executed: false
        });
        emit ProposalCreated(id, description, proposals[id].deadline);
    }

    /// @notice Vote weight = MRT balance + 10,000 MRT per owned property.
    /// @param support 0 = no, 1 = yes, 2 = abstain
    function vote(uint256 proposalId, uint8 support) external {
        Proposal storage p = proposals[proposalId];
        if (block.timestamp > p.deadline) revert ProposalClosed();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();
        hasVoted[proposalId][msg.sender] = true;

        uint256 weight = votingPower(msg.sender);
        if (support == 1) p.votesYes += uint128(weight);
        else if (support == 0) p.votesNo += uint128(weight);
        else p.votesAbstain += uint128(weight);
        emit Voted(proposalId, msg.sender, support, weight);
    }

    function votingPower(address voter) public view returns (uint256) {
        return mrt.balanceOf(voter) + uint256(propertiesOf[voter]) * VOTES_PER_PROPERTY;
    }

    // ─────────────────────────────── Views ───────────────────────────────

    function getApartment(uint256 apartmentId)
        external
        view
        returns (Apartment memory apt, address owner_, Listing memory listing)
    {
        apt = apartments[apartmentId];
        owner_ = _ownerOf(apartmentId);
        listing = listings[apartmentId];
    }
}
