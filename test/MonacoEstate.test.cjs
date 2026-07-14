const { expect } = require('chai');
const { ethers } = require('hardhat');

// End-to-end gameplay against the real contracts on the in-process chain.
describe('MonacoEstate', function () {
  let token, estate, admin, alice, bob, carol;

  before(async () => {
    [admin, alice, bob, carol] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('MortgageToken');
    token = await Token.deploy(admin.address);

    const Estate = await ethers.getContractFactory('MonacoEstate');
    estate = await Estate.deploy(await token.getAddress(), admin.address);

    await estate.addBuilding('Monte Carlo Casino');
    // apt 1: MRT-only, apt 2: ETH-only, apt 3: BOTH
    await estate.addApartment(0, 3, 'Apt 301', ethers.parseEther('4500'), ethers.parseEther('0.045'), 0, ethers.parseEther('120'), ethers.parseEther('280'));
    await estate.addApartment(0, 40, 'Penthouse', ethers.parseEther('25000'), ethers.parseEther('0.25'), 1, ethers.parseEther('750'), ethers.parseEther('900'));
    await estate.addApartment(0, 20, 'Suite 2001', ethers.parseEther('12000'), ethers.parseEther('0.12'), 2, ethers.parseEther('380'), ethers.parseEther('550'));

    // fund players with $MRT
    for (const p of [alice, bob, carol]) {
      await token.transfer(p.address, ethers.parseEther('100000'));
    }
    // treasury approves rent payouts
    await token.approve(await estate.getAddress(), ethers.parseEther('1000000'));
  });

  it('sells a primary apartment for MRT and pays 20% referral', async () => {
    await estate.connect(alice).registerReferrer(carol.address);
    await token.connect(alice).approve(await estate.getAddress(), ethers.parseEther('4500'));

    const carolBefore = await token.balanceOf(carol.address);
    await estate.connect(alice).buyWithMRT(1);

    expect(await estate.ownerOf(1)).to.equal(alice.address);
    const commission = (await token.balanceOf(carol.address)) - carolBefore;
    expect(commission).to.equal(ethers.parseEther('900')); // 20% of 4500
  });

  it('rejects MRT purchase of an ETH-only unit', async () => {
    await token.connect(bob).approve(await estate.getAddress(), ethers.parseEther('99999'));
    await expect(estate.connect(bob).buyWithMRT(2)).to.be.revertedWithCustomError(estate, 'WrongCurrency');
  });

  it('sells a primary apartment for ETH', async () => {
    await estate.connect(bob).buyWithETH(2, { value: ethers.parseEther('0.25') });
    expect(await estate.ownerOf(2)).to.equal(bob.address);
  });

  it('handles P2P listing + purchase with 2% fee and NFT transfer', async () => {
    await estate.connect(alice).list(1, ethers.parseEther('6000'), 0);
    await token.connect(bob).approve(await estate.getAddress(), ethers.parseEther('6000'));

    const aliceBefore = await token.balanceOf(alice.address);
    await estate.connect(bob).buyListing(1);

    expect(await estate.ownerOf(1)).to.equal(bob.address);
    // seller receives price - 2% fee (bob has no referrer)
    expect((await token.balanceOf(alice.address)) - aliceBefore).to.equal(ethers.parseEther('5880'));
  });

  it('accrues and pays rent over time', async () => {
    await ethers.provider.send('evm_increaseTime', [30 * 24 * 3600]); // one rent period
    await ethers.provider.send('evm_mine');

    const pending = await estate.pendingRent(2);
    expect(pending).to.be.gt(ethers.parseEther('600')); // 750 rent - 75 monthly cost ≈ 675

    const before = await token.balanceOf(bob.address);
    await estate.connect(bob).claimRent(2);
    expect((await token.balanceOf(bob.address)) - before).to.be.gte(pending);
  });

  it('weights governance votes by balance + properties', async () => {
    await estate.createProposal('Reduce maintenance by 15%', 7 * 24 * 3600);
    const power = await estate.votingPower(bob.address);
    expect(power).to.be.gt(ethers.parseEther('20000')); // 2 properties = 20k + balance

    await estate.connect(bob).vote(0, 1);
    const prop = await estate.proposals(0);
    expect(prop.votesYes).to.equal(power);
    await expect(estate.connect(bob).vote(0, 0)).to.be.revertedWithCustomError(estate, 'AlreadyVoted');
  });

  it('blocks double primary sales', async () => {
    await expect(estate.connect(carol).buyWithETH(2, { value: ethers.parseEther('0.25') }))
      .to.be.revertedWithCustomError(estate, 'AlreadySold');
  });
});
