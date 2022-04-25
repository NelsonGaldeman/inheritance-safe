//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract InheritanceSafe is Ownable {
    uint256 public constant MONTHS_TIME_FRAME = 6;
    address public inheritor;
    uint256 public proofOfLife;

    event InheritanceSafeCreated(address indexed owner, address indexed inheritor);
    event InheritorChanged(address indexed oldInheritor, address indexed newInheritor);
    event InheritorFundsUpdated(uint256 etherBalance);
    event ProofOfLifeUpdated(uint256 proofOfLife);

    constructor(address _inheritor) {
        inheritor = _inheritor;
        proofOfLife = block.timestamp;
        emit InheritanceSafeCreated(msg.sender, inheritor);
    }

    function setInheritor(address _inheritor) external virtual onlyOwner {
        emit InheritorChanged(inheritor, _inheritor);
        inheritor = _inheritor;
    }

    function alive() external virtual onlyOwner {
        proofOfLife = block.timestamp;
        emit ProofOfLifeUpdated(proofOfLife);
    }

    function claim(address _to) external virtual {
        require(inheritor == msg.sender || owner() == msg.sender);
        require(proofOfLife <= (block.timestamp - MONTHS_TIME_FRAME * 30 * 24 * 60 * 60) || owner() == msg.sender);

        // Send ether to inheritor
        payable(_to).transfer(address(this).balance);
    }

    // DEBUGGING / TESTING ONLY - PoC
    // Hack to make the contract testable
    function resetProofOfLife() external virtual onlyOwner {
        proofOfLife = 0;
        emit ProofOfLifeUpdated(proofOfLife);
    }

    receive() external payable {
        emit InheritorFundsUpdated(address(this).balance);
    }
}
