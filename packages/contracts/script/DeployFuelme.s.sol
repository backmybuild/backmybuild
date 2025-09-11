// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/Fuelme.sol";

contract DeployFuelme is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        new Fuelme(vm.envAddress("OWNER_ADDRESS"), 300, vm.envAddress("FEE_COLLECTOR"), vm.envAddress("USDC")); // 1% fee
        vm.stopBroadcast();
    }
}