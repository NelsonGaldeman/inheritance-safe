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
  it("Should validate inheritor can be updated", async function () {
    const newInheritor = await ethers.getSigner(2);
    await inheritanceSafe.setInheritor(await newInheritor.getAddress());
    inheritor = newInheritor;

    expect(await inheritanceSafe.inheritor()).to.equal(await newInheritor.getAddress());
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
  it("Owner should be able to claim ether anytime", async function () {
    // NOTE: At this point the contract should have 1 ether
    // Not ideal from testing perspective but good enough for PoC

    const owner = await ethers.getSigner(0);
    const ownerAddress = await owner.getAddress();

    // Fetch owner current balance
    let oldBalance = await ethers.provider.getBalance(ownerAddress);

    // Get contract available funds
    let contractBalance = await ethers.provider.getBalance(inheritanceSafe.address);

    // Claim ethers
    await inheritanceSafe.connect(owner).claim(ownerAddress);

    // Fetch new owner balance
    let balance = await ethers.provider.getBalance(ownerAddress);

    // Set a fixed fee estimation for claim tx
    let estimatedGasFees = ethers.BigNumber.from("100000000000000");

    // Validate
    expect(balance.sub(oldBalance).gt(contractBalance.sub(estimatedGasFees))).to.be.true;
  });
  it("Inheritor should be able to claim ether", async function () {
    // Lock 1 ether in the contract
    const etherToSend = ethers.utils.parseEther("1");
    const signer = await ethers.provider.getSigner(0);

    // Send ether to the contract
    await signer.sendTransaction({
      to: inheritanceSafe.address,
      value: etherToSend,
    });
    
    // Hack to make the contract testable
    await inheritanceSafe.resetProofOfLife();

    let inheritorAddress = await inheritor.getAddress();

    // Fetch inheritor current balance
    let oldBalance = await ethers.provider.getBalance(inheritorAddress);

    // Get contract available funds
    let contractBalance = await ethers.provider.getBalance(inheritanceSafe.address);

    // Claim inherit ether
    await inheritanceSafe.connect(inheritor).claim(inheritorAddress);

    // Fetch new inheritor balance
    let balance = await ethers.provider.getBalance(inheritorAddress);

    // Set a fixed fee estimation for claim tx
    let estimatedGasFees = ethers.BigNumber.from("100000000000000");

    // Validate
    expect(balance.sub(oldBalance).gt(contractBalance.sub(estimatedGasFees))).to.be.true;
  });
});
