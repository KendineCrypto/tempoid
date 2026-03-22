// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TempoNameService.sol";

contract DeployTempoNameService is Script {
    // pathUSD address on Tempo
    address constant PATHUSD = 0x20c0000000000000000000000000000000000000;

    function run() external {
        vm.startBroadcast();

        TempoNameService tns = new TempoNameService(PATHUSD);

        console.log("TempoNameService deployed at:", address(tns));
        console.log("Payment token (pathUSD):", PATHUSD);

        vm.stopBroadcast();
    }
}
