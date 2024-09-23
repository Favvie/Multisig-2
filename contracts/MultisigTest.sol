// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MultisigTest {
    uint256 public quorum;
    uint256 public noOfValidSigners;
    uint256 public txCount;

    struct Transaction {
        uint256 id;
        uint256 amount;
        address sender;
        address recipient;
        bool isCompleted;
        uint256 timestamp;
        uint256 noOfApproval;
        address tokenAddress;
        address[] transactionSigners;
    }
// struct QuorumStruct {
//     mapping(address => bool) hasApprovedQuorumChange;
//     bool quorumChangeActive;
//     uint8 quorumApprovalCount;
//     uint8 proposedQuorum;
// }

    mapping(address => bool) hasApprovedQuorumChange;
    bool public quorumChangeActive;
    uint8 public quorumApprovalCount;
    uint8 public proposedQuorum;

    mapping(address => bool) public isValidSigner;
    mapping(uint => Transaction ) public transactions; // txId -> Transaction
    // signer -> transactionId -> bool (checking if an address has signed)
    mapping(address => mapping(uint256 => bool)) public hasSigned;

    constructor(uint256 _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers");
        require(_quorum > 1, "quorum is too small");


        for(uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), "zero address not allowed");
            require(!isValidSigner[_validSigners[i]], "signer already exist");

            isValidSigner[_validSigners[i]] = true;
        }

        noOfValidSigners = _validSigners.length;

        if (!isValidSigner[msg.sender]){
            isValidSigner[msg.sender] = true;
            noOfValidSigners += 1;
        }

        require(_quorum <= noOfValidSigners, "quorum greater than valid signers");
        quorum = _quorum;
    }

    function transfer(uint256 _amount, address _recipient, address _tokenAddress) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");

        require(_amount > 0, "can't send zero amount");
        require(_recipient != address(0), "address zero found");
        require(_tokenAddress != address(0), "address zero found");

        require(IERC20(_tokenAddress).balanceOf(address(this)) >= _amount, "insufficient funds");

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];
        
        trx.id = _txId;
        trx.amount = _amount;
        trx.recipient = _recipient;
        trx.sender = msg.sender;
        trx.timestamp = block.timestamp;
        trx.tokenAddress = _tokenAddress;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);
        hasSigned[msg.sender][_txId] = true;

        txCount += 1;
    }

    function approveTx(uint8 _txId) external {
        Transaction storage trx = transactions[_txId];

        require(trx.id != 0, "invalid tx id");
        
        require(!trx.isCompleted, "transaction already completed");
        require(trx.noOfApproval < quorum, "approvals already reached");
        require(IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount, "insufficient funds");

        // for(uint256 i = 0; i < trx.transactionSigners.length; i++) {
        //     if(trx.transactionSigners[i] == msg.sender) {
        //         revert("can't sign twice");
        //     }
        // }

        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_txId], "can't sign twice");

        hasSigned[msg.sender][_txId] = true;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);

        if(trx.noOfApproval == quorum) {
            trx.isCompleted = true;
            IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount);
        }
    }



    function proposeNewQuorum(uint8 _newQuorum) external {
        // check if there is an active quorum proposal
        // require(quorumChangeActive, "Quorum Change in Progress");
        require(isValidSigner[msg.sender], "Not a valid signer");
        require(noOfValidSigners >= _newQuorum, "Quorum cannot exceed valid signers" );
        require(quorum != _newQuorum, "Same Quorum number");

        quorumChangeActive = false;
        quorumApprovalCount += 1;
        hasApprovedQuorumChange[msg.sender] = true;

        proposedQuorum = _newQuorum;


    }

    function ApproveQuorumChange() external {
        require(quorumChangeActive, 'No quorum changes in progress');
        require(isValidSigner[msg.sender], "Not a valid signer");
        require(!hasApprovedQuorumChange[msg.sender], "No duplicate approvals");
        
        hasApprovedQuorumChange[msg.sender] = true;
        quorumApprovalCount += 1;

        if (quorumApprovalCount == quorum) {
            quorum = proposedQuorum;

            quorumChangeActive = false;
            quorumApprovalCount = 0;
        }


    }

    function updateQuorum(uint8 _newQuorum) external {
        // what are we doing, trying to update the number of signers that need to approve a transaction
        // check the number of valid signers, make sure that the new quorum does not exceed it.
        //check if it is same, no need to do anything
        //check if all the signers have approved this change
        // check if valid signer is send this function

        require(noOfValidSigners >= _newQuorum, "Quorum cannot exceed valid signers" );
        require(quorum != _newQuorum, "Same Quorum number");
        require(isValidSigner[msg.sender], 'Not a valid signer');


        quorum = _newQuorum; 

    }
    
}
