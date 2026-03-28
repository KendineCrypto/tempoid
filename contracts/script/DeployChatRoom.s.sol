// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TempoChatRoom.sol";

contract DeployChatRoom is Script {
    // TempoNameService contract on Tempo
    address constant TNS = 0x9A56AE2275C85aaB13533c00d2cfa42C619Bc3A9;

    function run() external {
        vm.startBroadcast();

        TempoChatRoom chat = new TempoChatRoom(TNS);

        console.log("TempoChatRoom deployed at:", address(chat));
        console.log("NameService reference:", TNS);

        vm.stopBroadcast();
    }
}
