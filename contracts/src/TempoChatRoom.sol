// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TempoChatRoom
 * @notice On-chain chat room for .tempo name holders.
 *         Only verified .tempo owners can send messages.
 *         Messages are stored as events (cheap, permanent, queryable).
 *         Supports reply threading and relayer pattern for gasless agent messaging.
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
    address public owner;
    uint256 public messageCount;
    mapping(address => bool) public relayers;

    // --- Events ---
    event MessageSent(
        uint256 indexed messageId,
        uint256 indexed replyTo,
        string indexed name,
        address sender,
        string message,
        uint256 timestamp
    );
    event RelayerAdded(address relayer);
    event RelayerRemoved(address relayer);
    event OwnerTransferred(address newOwner);

    // --- Errors ---
    error NameNotRegistered(string name);
    error NameExpired(string name);
    error NotNameOwner(string name, address sender);
    error EmptyMessage();
    error MessageTooLong(uint256 length, uint256 maxLength);
    error InvalidReplyTarget(uint256 replyTo);
    error NotOwner();
    error NotRelayer();

    // --- Constants ---
    uint256 public constant MAX_MESSAGE_LENGTH = 500;
    uint256 public constant NO_REPLY = type(uint256).max;

    constructor(address _nameService) {
        nameService = ITempoNameService(_nameService);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // --- Admin ---

    function addRelayer(address relayer) external onlyOwner {
        relayers[relayer] = true;
        emit RelayerAdded(relayer);
    }

    function removeRelayer(address relayer) external onlyOwner {
        relayers[relayer] = false;
        emit RelayerRemoved(relayer);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
        emit OwnerTransferred(newOwner);
    }

    // --- Direct messaging (caller = name owner) ---

    function sendMessage(string calldata name, string calldata message) external {
        _send(name, message, NO_REPLY, msg.sender);
    }

    function reply(string calldata name, string calldata message, uint256 replyTo) external {
        if (replyTo >= messageCount) revert InvalidReplyTarget(replyTo);
        _send(name, message, replyTo, msg.sender);
    }

    // --- Relayer messaging (server sends on behalf of verified owner) ---

    function sendMessageFor(string calldata name, string calldata message, address sender) external {
        if (!relayers[msg.sender]) revert NotRelayer();
        _send(name, message, NO_REPLY, sender);
    }

    function replyFor(string calldata name, string calldata message, uint256 replyTo, address sender) external {
        if (!relayers[msg.sender]) revert NotRelayer();
        if (replyTo >= messageCount) revert InvalidReplyTarget(replyTo);
        _send(name, message, replyTo, sender);
    }

    // --- Internal ---

    function _send(string calldata name, string calldata message, uint256 replyTo, address sender) internal {
        if (bytes(message).length == 0) revert EmptyMessage();
        if (bytes(message).length > MAX_MESSAGE_LENGTH) {
            revert MessageTooLong(bytes(message).length, MAX_MESSAGE_LENGTH);
        }

        (address nameOwner, , bool isExpired, bool isAvailable) = nameService.getNameInfo(name);

        if (isAvailable || nameOwner == address(0)) revert NameNotRegistered(name);
        if (isExpired) revert NameExpired(name);
        if (nameOwner != sender) revert NotNameOwner(name, sender);

        uint256 messageId = messageCount;
        messageCount++;

        emit MessageSent(messageId, replyTo, name, sender, message, block.timestamp);
    }
}
