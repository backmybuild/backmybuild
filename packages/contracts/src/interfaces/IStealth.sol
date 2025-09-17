// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IStealth {
    struct TranferAuthorized {
        address from;
        uint256 value;
        uint256 validAfter;
        uint256 validBefore;
        bytes signature;
    }

    struct FullTranferAuthorized {
        address from;
        address to;
        uint256 value;
        bytes signature;
    }

    struct Donation {
        address to;
        bytes1 viewTag;
        bytes ephemeralPublicKey; // onetime public key
        bytes message;
    }

    struct Profile {
        bytes key;
        bytes profile;
        uint256 createdAt;
    }

    function donate(Donation calldata _donation) external payable;
}
