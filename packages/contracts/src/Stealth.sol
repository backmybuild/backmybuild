// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "openzeppelin/access/Ownable.sol";
import "openzeppelin/utils/cryptography/ECDSA.sol";
import "openzeppelin/utils/cryptography/EIP712.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IUSDC.sol";

contract Stealth is Ownable, EIP712 {
    using SafeERC20 for IUSDC;

    bytes32 public constant TYPEHASH =
        keccak256("UpdateProfile(bytes key,bytes profile,uint256 nonce)");
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
        uint256 validAfter;
        uint256 validBefore;
        bytes32 nonce;
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
    }

    uint256 public feePercent;
    address public feeCollector;
    address[] public authorizers; // for query

    mapping(bytes => bytes) public keys; // hash(username) -> encoded composed key
    mapping(bytes => bytes) public profiles; // hash(username) -> encoded profile
    mapping(address => bytes) public authorizedKeys; // address -> hash(username), for query
    mapping(address => mapping(uint256 => bool)) public nonceUsed; // address -> nonce -> used

    mapping(address => Profile) public profilesOfAddress; // address -> Profile,
    mapping(string => address) public addressOfUsername; // hash(username) -> address
    mapping(address => address) public addressOfAuthorizer; // address -> authorizer address

    event FeePercentUpdated(uint256 newFeePercent);
    event FeeCollectorUpdated(address newFeeCollector);
    event ProfileUpdated(bytes username);
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
    ) Ownable(_owner) EIP712("FuelMe", "1") {
        feePercent = _feePercent;
        feeCollector = _feeCollector;
        USDC = IUSDC(_usdc);
    }

    function _useNonce(address _user, uint256 _nonce) internal {
        require(!nonceUsed[_user][_nonce], "Nonce used");
        nonceUsed[_user][_nonce] = true;
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

    function updateProfile(
        bytes calldata _username,
        Profile calldata _profile,
        address _authorizer
    ) external {
        require(_username.length > 0, "Invalid username");

        
        emit ProfileUpdated(_username);
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
        FullTranferAuthorized[] calldata _transfers
    ) external {
        for (uint256 i = 0; i < _transfers.length; i++) {
            FullTranferAuthorized calldata transfer = _transfers[i];
            USDC.transferWithAuthorization(
                transfer.from,
                transfer.to,
                transfer.value,
                transfer.validAfter,
                transfer.validBefore,
                transfer.nonce,
                transfer.signature
            );
        }
    }

    function getProfile(
        bytes memory _username
    ) external view returns (bytes memory, bytes memory) {
        return (keys[_username], profiles[_username]);
    }

    function getProfileByAddress(
        address _authorizer
    ) external view returns (bytes memory, bytes memory, bytes memory) {
        bytes memory username = authorizedKeys[_authorizer];
        return (username, keys[username], profiles[username]);
    }

    function getAuthorizersCount() external view returns (uint256) {
        return authorizers.length;
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

    function getAuthorizers(
        uint256 _startIndex,
        uint256 _length
    ) external view returns (address[] memory addresses, bytes[] memory keyOfUsers) {
        uint256 total = authorizers.length;
        if (_startIndex >= total) {
            return (new address[](0), new bytes[](0));
        }
        uint256 endIndex = _startIndex + _length;
        if (endIndex > total) {
            endIndex = total;
        }
        _length = endIndex - _startIndex;

        addresses = new address[](_length);
        for (uint256 i = 0; i < _length; i++) {
            addresses[i] = authorizers[_startIndex + i];
        }
        keyOfUsers = new bytes[](_length);
        for (uint256 i = 0; i < _length; i++) {
            keyOfUsers[i] = keys[authorizedKeys[addresses[i]]];
        }
    }
}
