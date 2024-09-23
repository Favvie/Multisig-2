// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./MultisigTest.sol";

contract MultisigFactory {

    MultisigTest[] multisigClones;

    function createMultisigWallet(uint256 _quorum, address[] memory _validSigners) external returns (MultisigTest newMulsig_, uint256 length_) {

        newMulsig_ = new MultisigTest(_quorum, _validSigners);

        multisigClones.push(newMulsig_);

        length_ = multisigClones.length;
    }

    function getMultiSigClones() external view returns(MultisigTest[] memory) {
        return multisigClones;
    }
}