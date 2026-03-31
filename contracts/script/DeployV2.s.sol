// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TempoNameServiceV2.sol";

contract DeployTempoNameServiceV2 is Script {
    // Token addresses on Tempo (Chain ID 4217)
    address constant PATHUSD = 0x20C0000000000000000000000000000000000000;
    address constant USDC_E  = 0x20C000000000000000000000b9537d11c60E8b50;
    address constant USDT0   = 0x20C00000000000000000000014f22CA97301EB73;

    function run() external {
        vm.startBroadcast();

        TempoNameServiceV2 tns = new TempoNameServiceV2(PATHUSD, USDC_E, USDT0);

        console.log("TempoNameServiceV2 deployed at:", address(tns));
        console.log("Accepted tokens: pathUSD, USDC.e, USDT0");

        vm.stopBroadcast();
    }
}
