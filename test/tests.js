const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InheritanceSafe", function () {
  let inheritanceSafe;
  let inheritor;
  let firstProofOfLife;
  before(async () => {
    // Get a random signer (different to deployer) to be inheritor
    inheritor = await ethers.getSigner(1);

    // Deploy contract
    const InheritanceSafe = await ethers.getContractFactory("contracts/InheritanceSafe.sol:InheritanceSafe");
    inheritanceSafe = await InheritanceSafe.deploy(await inheritor.getAddress());
    await inheritanceSafe.deployed();
    firstProofOfLife = Math.round((new Date().getTime() / 1000));
  });
  it("Should validate inheritor is properly set", async function () {
    expect(await inheritanceSafe.inheritor()).to.equal(await inheritor.getAddress());
  });
  it("Should validate proof of life is set", async function () {
    expect((await inheritanceSafe.proofOfLife()).gt(0)).to.be.true;
  });
  it("Should update PoL and validate it", async function () {
    // Wait 1s so the PoL changes
    await new Promise(r => setTimeout(r, 3000));

    // Update PoL
    await inheritanceSafe.alive();

    // Fetch and validate
    let proofOfLife = await inheritanceSafe.proofOfLife();
    expect(proofOfLife.gt(firstProofOfLife)).to.be.true;
  });
  it("Should be able to receive ether", async function () {
    // Fetch the owner/deployer address
    const signer = await ethers.provider.getSigner(0);

    let etherToSend = ethers.utils.parseEther("1");

    // Send ether to the contract
    await signer.sendTransaction({
      to: inheritanceSafe.address,
      value: etherToSend
    });

    // Get contract ether balance
    let balance = await ethers.provider.getBalance(inheritanceSafe.address);

    // Validate
    expect(etherToSend.eq(balance)).to.be.true;
  });
  it("Should be able to claim ether", async function () {
    // NOTE: At this point the contract should have 1 ether
    // Not ideal from testing perspective but good enough for PoC

    // Hack to make the contract testable
    await inheritanceSafe.resetProofOfLife();

    // Fetch inheritor current balance
    let oldBalance = await ethers.provider.getBalance(await inheritor.getAddress());

    // Get contract available funds
    let contractBalance = await ethers.provider.getBalance(inheritanceSafe.address);

    // Claim inherit ether
    await inheritanceSafe.connect(inheritor).claim();

    // Fetch new inheritor balance
    let balance = await ethers.provider.getBalance(await inheritor.getAddress());

    // Set a fixed fee estimation for claim tx
    let estimatedGasFees = ethers.BigNumber.from("100000000000000");

    // Validate
    expect(balance.sub(oldBalance).gt(contractBalance.sub(estimatedGasFees))).to.be.true;
  });
});
