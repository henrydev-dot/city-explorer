// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Mortgage Token ($MRT)
/// @notice In-game currency of Monaco Estate. The canonical deployment on Base
///         lives at 0xb200000000000000000000d8b21449ecf586c801 — this source is
///         the reference implementation used for local testing and audits.
contract MortgageToken is ERC20, ERC20Permit, Ownable {
    constructor(address initialHolder)
        ERC20("Mortgage", "MRT")
        ERC20Permit("Mortgage")
        Ownable(msg.sender)
    {
        // 1 billion MRT fixed supply, 18 decimals
        _mint(initialHolder, 1_000_000_000 ether);
    }
}
