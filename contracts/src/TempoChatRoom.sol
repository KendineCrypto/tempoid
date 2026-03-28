// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TempoChatRoom
 * @notice On-chain chat room for .tempo name holders.
 *         Only verified .tempo owners can send messages.
 *         Messages are stored as events (cheap, permanent, queryable).
 */

interface ITempoNameService {
    function resolve(string calldata name) external view returns (address);
    function getNameInfo(string calldata name) external view returns (
        address owner,
        uint256 expiry,
        bool isExpired,
        bool isAvailable
    );
}

contract TempoChatRoom {
    // --- State ---
    ITempoNameService public immutable nameService;
    uint256 public messageCount;

    // --- Events ---
    event MessageSent(
        uint256 indexed messageId,
        string indexed name,
        address indexed sender,
        string message,
        uint256 timestamp
    );

    // --- Errors ---
    error NameNotRegistered(string name);
    error NameExpired(string name);
    error NotNameOwner(string name, address sender);
    error EmptyMessage();
    error MessageTooLong(uint256 length, uint256 maxLength);

    // --- Constants ---
    uint256 public constant MAX_MESSAGE_LENGTH = 500;

    constructor(address _nameService) {
        nameService = ITempoNameService(_nameService);
    }

    /**
     * @notice Send a message to the chat room.
     * @param name Your .tempo name (without .tempo suffix)
     * @param message The message content (max 500 chars)
     */
    function sendMessage(string calldata name, string calldata message) external {
        // Validate message
        if (bytes(message).length == 0) revert EmptyMessage();
        if (bytes(message).length > MAX_MESSAGE_LENGTH) {
            revert MessageTooLong(bytes(message).length, MAX_MESSAGE_LENGTH);
        }

        // Verify .tempo name ownership via TempoNameService contract
        (address owner, , bool isExpired, bool isAvailable) = nameService.getNameInfo(name);

        if (isAvailable || owner == address(0)) revert NameNotRegistered(name);
        if (isExpired) revert NameExpired(name);
        if (owner != msg.sender) revert NotNameOwner(name, msg.sender);

        // Emit message event
        uint256 messageId = messageCount;
        messageCount++;

        emit MessageSent(messageId, name, msg.sender, message, block.timestamp);
    }
}
