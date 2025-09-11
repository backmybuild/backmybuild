// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/Fuelme.sol";

contract SigUtils {
    // mirrors contract
    bytes32 public constant UPDATE_TYPEHASH =
        keccak256(
            "UpdateProfile(bytes32 username,bytes profile,uint256 nonce)"
        );

    // EIP712Domain hash
    bytes32 private constant _EIP712DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    function domainSeparator(
        string memory name,
        string memory version,
        uint256 chainId,
        address verifying
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    _EIP712DOMAIN_TYPEHASH,
                    keccak256(bytes(name)),
                    keccak256(bytes(version)),
                    chainId,
                    verifying
                )
            );
    }

    function structHash(
        bytes32 username,
        bytes memory profile,
        uint256 nonce
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encode(UPDATE_TYPEHASH, username, keccak256(profile), nonce)
            );
    }

    function digest(
        bytes32 domainSep,
        bytes32 _structHash
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", domainSep, _structHash));
    }
}

contract FuelmeTest is Test {
    Fuelme fuel;
    SigUtils sig;

    address owner;
    address payable feeCollector;

    uint256 alicePk = 0xA11CE;
    address alice; // profile owner (signer)

    uint256 bobPk = 0xB0B;
    address bob; // different signer

    // helpers
    function _signUpdate(
        uint256 pk,
        bytes32 username,
        bytes memory profile,
        uint256 nonce
    ) internal view returns (bytes memory sigBytes) {
        bytes32 dom = sig.domainSeparator(
            "FuelMe",
            "1",
            block.chainid,
            address(fuel)
        );
        bytes32 sh = sig.structHash(username, profile, nonce);
        bytes32 dig = sig.digest(dom, sh);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, dig);
        sigBytes = abi.encodePacked(r, s, v);
    }

    function setUp() public {
        // make the chain ID explicit for EIP-712 determinism
        vm.chainId(31337);

        owner = address(0xABCD);
        feeCollector = payable(address(0xFEE));
        alice = vm.addr(alicePk);
        bob = vm.addr(bobPk);

        fuel = new Fuelme(owner, /*fee*/ 100, /*1%*/ feeCollector, address(0x0));
        sig = new SigUtils();
    }

    function test_OwnershipAndFeeUpdates() public {
        // only owner can update
        vm.prank(owner);
        fuel.updateFeePercent(250); // 2.5%
        assertEq(fuel.feePercent(), 250);

        vm.prank(owner);
        fuel.updateFeeCollector(address(0x1234));
        assertEq(fuel.feeCollector(), address(0x1234));

        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                address(this)
            )
        );
        fuel.updateFeePercent(300);
    }

    function test_UpdateProfile_Create() public {
        bytes32 uname = keccak256(bytes("alice"));
        bytes memory key = abi.encodePacked("stealth-key-blob");
        bytes memory profile = abi.encodePacked("profile-v1");
        uint256 nonce = 1;

        bytes memory signature = _signUpdate(alicePk, uname, profile, nonce);

        vm.expectEmit(true, false, false, true);
        emit Fuelme.ProfileUpdated(uname);

        fuel.updateProfile(uname, key, profile, nonce, signature);

        (bytes memory gotKey, bytes memory gotProfile) = fuel.getProfile(uname);
        assertEq(keccak256(gotKey), keccak256(key));
        assertEq(keccak256(gotProfile), keccak256(profile));
        assertEq(fuel.authorizedKeys(alice), uname);

        // authorizers cached
        (address[] memory auths, uint256 total) = fuel.getAuthorizers(0, 10);
        assertEq(total, 1);
        assertEq(auths.length, 1);
        assertEq(auths[0], alice);

        // nonce cannot be reused
        vm.expectRevert(bytes("Nonce used"));
        fuel.updateProfile(uname, key, profile, nonce, signature);
    }

    function test_UpdateProfile_UpdateSameUser() public {
        // create
        bytes32 uname = keccak256(bytes("alice"));
        bytes memory key = bytes("key");
        bytes memory profile1 = bytes("p1");
        bytes memory sig1 = _signUpdate(alicePk, uname, profile1, 1);
        fuel.updateProfile(uname, key, profile1, 1, sig1);

        // update with same signer, new nonce & data
        bytes memory profile2 = bytes("p2");
        bytes memory sig2 = _signUpdate(alicePk, uname, profile2, 2);

        vm.expectEmit(true, false, false, true);
        emit Fuelme.ProfileUpdated(uname);

        fuel.updateProfile(uname, key, profile2, 2, sig2);

        (, bytes memory gotProfile) = fuel.getProfile(uname);
        assertEq(keccak256(gotProfile), keccak256(profile2));
    }

    function test_UpdateProfile_NotAuthorizedToUpdate() public {
        // alice creates
        bytes32 uname = keccak256(bytes("alice"));
        bytes memory key = bytes("key");
        bytes memory profile1 = bytes("p1");
        bytes memory sig1 = _signUpdate(alicePk, uname, profile1, 1);
        fuel.updateProfile(uname, key, profile1, 1, sig1);

        // bob attempts to update alice's username
        bytes memory profile2 = bytes("p2");
        bytes memory sig2 = _signUpdate(bobPk, uname, profile2, 1);

        vm.expectRevert(bytes("Not authorized to update"));
        fuel.updateProfile(uname, key, profile2, 1, sig2);
    }

    function test_UpdateProfile_AlreadyRegisteredDifferentUsername() public {
        // alice registers to uname1
        bytes32 uname1 = keccak256(bytes("alice"));
        bytes memory key = bytes("key");
        bytes memory p1 = bytes("p1");
        bytes memory sig1 = _signUpdate(alicePk, uname1, p1, 1);
        fuel.updateProfile(uname1, key, p1, 1, sig1);

        // alice tries to CREATE a different username (profile empty) => should revert "Already registered"
        bytes32 uname2 = keccak256(bytes("alice2"));
        bytes memory p2 = bytes("p2");
        bytes memory sig2 = _signUpdate(alicePk, uname2, p2, 2);

        vm.expectRevert(bytes("Already registered"));
        fuel.updateProfile(uname2, key, p2, 2, sig2);
    }

    function test_UpdateProfile_InvalidUsernameZero() public {
        bytes32 uname = bytes32(0);
        bytes memory key = bytes("key");
        bytes memory p = bytes("p");
        bytes memory sig1 = _signUpdate(alicePk, uname, p, 1);

        vm.expectRevert(bytes("Invalid username"));
        fuel.updateProfile(uname, key, p, 1, sig1);
    }

    function test_GetAuthorizers_Pagination() public {
        // create 3 users
        for (uint256 i = 1; i <= 3; i++) {
            uint256 pk = i + 100;
            address signer = vm.addr(pk);
            bytes32 uname = keccak256(abi.encodePacked("u", i));
            bytes memory sigN = _signUpdate(
                pk,
                uname,
                abi.encodePacked("p", i),
                1
            );
            fuel.updateProfile(
                uname,
                bytes("k"),
                abi.encodePacked("p", i),
                1,
                sigN
            );
            assertEq(fuel.authorizedKeys(signer), uname);
        }

        (address[] memory a0, uint256 total) = fuel.getAuthorizers(0, 2);
        assertEq(total, 3);
        assertEq(a0.length, 2);

        (address[] memory a1, ) = fuel.getAuthorizers(2, 5);
        assertEq(a1.length, 1);

        (address[] memory a2, ) = fuel.getAuthorizers(5, 5);
        assertEq(a2.length, 0);
    }

    function test_Announce_FeeDeductionAndEvent() public {
        // set 2% fee
        vm.prank(owner);
        fuel.updateFeePercent(200);

        address payable stealth = payable(address(0xBEEF));
        vm.deal(address(this), 10 ether); // fund test caller

        uint256 startStealth = stealth.balance;
        uint256 startFee = feeCollector.balance;

        uint256 amount = 1 ether;
        uint256 expectedFee = (amount * 200) / fuel.FEE_DENOMINATOR(); // 0.02 ETH
        uint256 expectedToStealth = amount - expectedFee;

        // expect event with net amount
        vm.expectEmit(true, true, false, true);
        emit Fuelme.Announcement(
            stealth,
            777,
            hex"abcd",
            expectedToStealth,
            hex"6869"
        );

        // fuel.announce{value: amount}(stealth, 777, hex"abcd", hex"6869");

        assertEq(stealth.balance, startStealth + expectedToStealth);
        assertEq(feeCollector.balance, startFee + expectedFee);
    }

    function test_Announce_NoFeeCollectorSendsAll() public {
        vm.prank(owner);
        fuel.updateFeeCollector(address(0)); // disable fee

        address payable stealth = payable(address(0xC0FFEE));
        vm.deal(address(this), 1 ether);

        uint256 startStealth = stealth.balance;
        // fuel.announce{value: 1 ether}(stealth, 1, "", "");
        assertEq(stealth.balance, startStealth + 1 ether);
    }

    function test_Announce_RevertsWhenFeePercentTooHighAtRuntime() public {
        // owner sets >100% (contract currently allows it)
        vm.prank(owner);
        vm.expectRevert("Fee too high");
        fuel.updateFeePercent(20000); // 200%
    }
}
