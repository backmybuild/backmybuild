// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "openzeppelin/access/Ownable.sol";
import "openzeppelin/utils/cryptography/ECDSA.sol";
import "openzeppelin/utils/cryptography/EIP712.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IUSDC.sol";

contract Stealth is Ownable {
    using SafeERC20 for IUSDC;

    uint256 public constant FEE_DENOMINATOR = 10000;
    IUSDC public immutable USDC;

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
        uint16 viewTag;
        bytes ephemeralPublicKey; // onetime public key
        bytes message;
    }

    struct Profile {
        bytes key;
        bytes profile;
        uint256 createdAt;
    }

    uint256 public feePercent;
    address public feeCollector;

    mapping(address => Profile) public profilesOfAddress; // address -> Profile,

    event FeePercentUpdated(uint256 newFeePercent);
    event FeeCollectorUpdated(address newFeeCollector);
    event ProfileUpdated(address indexed user);
    event Announcement(
        address indexed stealthAddress,
        uint16 indexed viewTag,
        bytes ephemeralPublicKey,
        uint256 amount,
        bytes message
    );

    constructor(
        address _owner,
        uint256 _feePercent,
        address _feeCollector,
        address _usdc
    ) Ownable(_owner) {
        feePercent = _feePercent;
        feeCollector = _feeCollector;
        USDC = IUSDC(_usdc);
    }

    function updateFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= FEE_DENOMINATOR, "Fee too high");
        feePercent = _feePercent;
        emit FeePercentUpdated(_feePercent);
    }

    function updateFeeCollector(address _feeCollector) external onlyOwner {
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }

    function createProfile(
        bytes calldata _key,
        bytes calldata _profile
    ) external {
        require(
            profilesOfAddress[msg.sender].createdAt == 0,
            "Profile already exists"
        );
        profilesOfAddress[msg.sender] = Profile({
            key: _key,
            profile: _profile,
            createdAt: block.timestamp
        });

        emit ProfileUpdated(msg.sender);
    }

    function updateProfile(bytes calldata _profile) external {
        profilesOfAddress[msg.sender].profile = _profile;

        emit ProfileUpdated(msg.sender);
    }

    function donate(
        Donation calldata _donation,
        TranferAuthorized calldata _transfer
    ) external payable {
        bytes32 nonce = hashDonation(_donation);
        uint256 amount = _transfer.value;

        require(_donation.to != address(0), "Invalid to");
        require(amount > 0, "Invalid amount");

        uint256 fee = (amount * feePercent) / FEE_DENOMINATOR;

        USDC.receiveWithAuthorization(
            _transfer.from,
            address(this),
            _transfer.value,
            _transfer.validAfter,
            _transfer.validBefore,
            nonce,
            _transfer.signature
        ); // only this contract can call this action

        USDC.transfer(feeCollector, fee);
        USDC.transfer(_donation.to, amount - fee);

        emit Announcement(
            _donation.to,
            _donation.viewTag,
            _donation.ephemeralPublicKey,
            amount - fee,
            _donation.message
        );
    }

    function multipleTransferAuthorized(
        FullTranferAuthorized[] calldata _transfers,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce
    ) external {
        for (uint256 i = 0; i < _transfers.length; i++) {
            FullTranferAuthorized calldata transfer = _transfers[i];
            USDC.transferWithAuthorization(
                transfer.from,
                transfer.to,
                transfer.value,
                validAfter,
                validBefore,
                nonce,
                transfer.signature
            );
        }
    }

    function hashDonation(
        Donation memory _donation
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    _donation.to,
                    _donation.viewTag,
                    _donation.ephemeralPublicKey,
                    _donation.message
                )
            );
    }
}
