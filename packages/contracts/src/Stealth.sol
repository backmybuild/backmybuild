// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "openzeppelin/access/Ownable.sol";

import "./interfaces/IERC5564Announcer.sol";
import "./interfaces/IStealth.sol";

contract Stealth is IStealth, Ownable {
    uint256 public constant FEE_DENOMINATOR = 10000;
    IERC5564Announcer public immutable ANNOUNCER;

    uint256 public feePercent;
    address public feeCollector;

    mapping(address => Profile) public profilesOfAddress; // address -> Profile,

    event FeePercentUpdated(uint256 newFeePercent);
    event FeeCollectorUpdated(address newFeeCollector);
    event ProfileUpdated(address indexed user);

    constructor(
        address _owner,
        uint256 _feePercent,
        address _feeCollector,
        address _announcer
    ) Ownable(_owner) {
        feePercent = _feePercent;
        feeCollector = _feeCollector;
        ANNOUNCER = IERC5564Announcer(_announcer);
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
            createdAt: block.number
        });

        emit ProfileUpdated(msg.sender);
    }

    function updateProfile(bytes calldata _profile) external {
        profilesOfAddress[msg.sender].profile = _profile;

        emit ProfileUpdated(msg.sender);
    }

    function donate(Donation calldata _donation) external payable {
        require(_donation.to != address(0), "Invalid to");
        require(msg.value > 0, "Invalid amount");

        uint256 fee = (msg.value * feePercent) / FEE_DENOMINATOR;

        (bool sentFee, ) = payable(feeCollector).call{value: fee}("");
        require(sentFee, "Failed to send fee");

        (bool sent, ) = payable(_donation.to).call{value: msg.value - fee}("");
        require(sent, "Failed to send ETH");

        ANNOUNCER.announce(
            1, // schemeId for secp256k1
            _donation.to,
            _donation.ephemeralPublicKey,
            abi.encode(_donation.viewTag, _donation.message)
        );
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
