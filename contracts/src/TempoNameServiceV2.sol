// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title TempoNameServiceV2
/// @notice Multi-token (.tempo, .mpp, .agent, .ai) name service on Tempo
/// @dev Accepts pathUSD, USDC.e, and USDT0 for payments
contract TempoNameServiceV2 is Ownable, ReentrancyGuard {
    // --- Types ---
    struct NameRecord {
        address owner;
        uint256 expiry;
        mapping(string => string) metadata;
        string[] metadataKeys;
    }

    struct Listing {
        address seller;
        uint256 price;
        address priceToken; // which token the price is in
        bool active;
    }

    // --- Constants ---
    uint256 public constant REGISTRATION_PERIOD = 365 days;
    uint256 public constant GRACE_PERIOD = 30 days;
    uint256 public constant MIN_NAME_LENGTH = 3;
    uint256 public constant MAX_NAME_LENGTH = 63;

    // --- State ---
    mapping(address => bool) public acceptedTokens;
    address[] public tokenList;

    mapping(string => NameRecord) private _records;
    mapping(address => string) private _primaryNames;
    mapping(uint8 => uint256) public yearlyFees; // charLength => fee (6 decimals)

    // Owner name enumeration
    mapping(address => string[]) private _ownedNames;
    mapping(string => uint256) private _ownedIndex;

    // Marketplace
    mapping(string => Listing) private _listings;
    string[] private _listedNames;
    mapping(string => uint256) private _listedIndex;
    uint256 public marketplaceFee = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;

    // --- Events ---
    event NameRegistered(string indexed name, address indexed owner, uint256 expiry, address token);
    event NameRenewed(string indexed name, uint256 newExpiry, address token);
    event NameTransferred(string indexed name, address indexed from, address indexed to);
    event PrimaryNameSet(address indexed owner, string name);
    event PrimaryNameCleared(address indexed owner);
    event MetadataSet(string indexed name, string key, string value);
    event MetadataCleared(string indexed name);
    event YearlyFeeUpdated(uint8 charLength, uint256 fee);
    event NameListed(string indexed name, address indexed seller, uint256 price, address token);
    event ListingCancelled(string indexed name, address indexed seller);
    event NameSold(string indexed name, address indexed seller, address indexed buyer, uint256 price, uint256 fee, address token);
    event MarketplaceFeeUpdated(uint256 newFee);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    // --- Errors ---
    error NameNotAvailable();
    error NameExpired();
    error NotNameOwner();
    error InvalidName();
    error InsufficientPayment();
    error InvalidDuration();
    error NotListed();
    error InvalidPrice();
    error CannotBuyOwnName();
    error InvalidAddress();
    error NoPrimaryName();
    error FeeAboveMaximum();
    error TokenNotAccepted();

    constructor(
        address _pathUSD,
        address _usdce,
        address _usdt0
    ) Ownable(msg.sender) {
        // Accept all three tokens
        _addToken(_pathUSD);
        _addToken(_usdce);
        _addToken(_usdt0);

        // Default fees (6 decimals — same for all tokens)
        yearlyFees[3] = 20 * 1e6;  // 3 char: $20/year
        yearlyFees[4] = 5 * 1e6;   // 4 char: $5/year
        yearlyFees[5] = 1 * 1e6;   // 5+ char: $1/year
    }

    // ==================== Registration ====================

    function register(string calldata name, uint256 years_, address token) external nonReentrant {
        _validateName(name);
        if (years_ == 0) revert InvalidDuration();
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        NameRecord storage record = _records[name];

        bool isNewRegistration = record.owner == address(0);
        bool isExpiredPastGrace = !isNewRegistration && block.timestamp > record.expiry + GRACE_PERIOD;

        if (!isNewRegistration && !isExpiredPastGrace) {
            revert NameNotAvailable();
        }

        if (isExpiredPastGrace) {
            _removeFromOwner(record.owner, name);
            _clearMetadata(name);
            if (_listings[name].active) {
                emit ListingCancelled(name, _listings[name].seller);
                _removeListing(name);
            }
        }

        uint256 fee = getRegistrationFee(name, years_);
        IERC20(token).transferFrom(msg.sender, address(this), fee);

        record.owner = msg.sender;
        record.expiry = block.timestamp + (REGISTRATION_PERIOD * years_);

        _addToOwner(msg.sender, name);

        if (bytes(_primaryNames[msg.sender]).length == 0) {
            _primaryNames[msg.sender] = name;
            emit PrimaryNameSet(msg.sender, name);
        }

        emit NameRegistered(name, msg.sender, record.expiry, token);
    }

    // ==================== Resolution ====================

    function resolve(string calldata name) external view returns (address) {
        NameRecord storage record = _records[name];
        if (record.owner == address(0) || block.timestamp > record.expiry) {
            revert NameExpired();
        }
        return record.owner;
    }

    function reverseLookup(address addr) external view returns (string memory) {
        string memory name = _primaryNames[addr];
        if (bytes(name).length == 0) revert NoPrimaryName();

        NameRecord storage record = _records[name];
        if (block.timestamp > record.expiry) revert NameExpired();

        return name;
    }

    // ==================== Management ====================

    function renew(string calldata name, uint256 years_, address token) external nonReentrant {
        if (years_ == 0) revert InvalidDuration();
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        NameRecord storage record = _records[name];
        if (record.owner == address(0)) revert NameExpired();
        if (block.timestamp > record.expiry + GRACE_PERIOD) revert NameExpired();

        uint256 fee = getRegistrationFee(name, years_);
        IERC20(token).transferFrom(msg.sender, address(this), fee);

        uint256 baseTime = block.timestamp > record.expiry ? block.timestamp : record.expiry;
        record.expiry = baseTime + (REGISTRATION_PERIOD * years_);

        emit NameRenewed(name, record.expiry, token);
    }

    function transfer(string calldata name, address newOwner) external nonReentrant {
        if (newOwner == address(0)) revert InvalidAddress();

        NameRecord storage record = _records[name];
        if (record.owner != msg.sender) revert NotNameOwner();
        if (block.timestamp > record.expiry) revert NameExpired();

        if (_listings[name].active) {
            _removeListing(name);
            emit ListingCancelled(name, msg.sender);
        }

        address oldOwner = record.owner;
        record.owner = newOwner;

        _removeFromOwner(oldOwner, name);
        _addToOwner(newOwner, name);

        if (keccak256(bytes(_primaryNames[oldOwner])) == keccak256(bytes(name))) {
            delete _primaryNames[oldOwner];
            emit PrimaryNameCleared(oldOwner);
        }

        if (bytes(_primaryNames[newOwner]).length == 0) {
            _primaryNames[newOwner] = name;
            emit PrimaryNameSet(newOwner, name);
        }

        emit NameTransferred(name, oldOwner, newOwner);
    }

    function setPrimaryName(string calldata name) external {
        NameRecord storage record = _records[name];
        if (record.owner != msg.sender) revert NotNameOwner();
        if (block.timestamp > record.expiry) revert NameExpired();

        _primaryNames[msg.sender] = name;
        emit PrimaryNameSet(msg.sender, name);
    }

    function clearPrimaryName() external {
        if (bytes(_primaryNames[msg.sender]).length == 0) revert NoPrimaryName();
        delete _primaryNames[msg.sender];
        emit PrimaryNameCleared(msg.sender);
    }

    function setMetadata(string calldata name, string calldata key, string calldata value) external {
        NameRecord storage record = _records[name];
        if (record.owner != msg.sender) revert NotNameOwner();
        if (block.timestamp > record.expiry) revert NameExpired();

        if (bytes(record.metadata[key]).length == 0 && bytes(value).length > 0) {
            record.metadataKeys.push(key);
        }

        record.metadata[key] = value;
        emit MetadataSet(name, key, value);
    }

    // ==================== Marketplace ====================

    function listForSale(string calldata name, uint256 price, address token) external {
        NameRecord storage record = _records[name];
        if (record.owner != msg.sender) revert NotNameOwner();
        if (block.timestamp > record.expiry) revert NameExpired();
        if (price == 0) revert InvalidPrice();
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        Listing storage listing = _listings[name];

        if (!listing.active) {
            _listedIndex[name] = _listedNames.length;
            _listedNames.push(name);
        }

        listing.seller = msg.sender;
        listing.price = price;
        listing.priceToken = token;
        listing.active = true;

        emit NameListed(name, msg.sender, price, token);
    }

    function cancelListing(string calldata name) external {
        Listing storage listing = _listings[name];
        if (!listing.active) revert NotListed();
        if (listing.seller != msg.sender) revert NotNameOwner();

        _removeListing(name);
        emit ListingCancelled(name, msg.sender);
    }

    function buyName(string calldata name) external nonReentrant {
        Listing storage listing = _listings[name];
        if (!listing.active) revert NotListed();

        NameRecord storage record = _records[name];
        if (block.timestamp > record.expiry) revert NameExpired();
        if (msg.sender == listing.seller) revert CannotBuyOwnName();

        uint256 price = listing.price;
        address seller = listing.seller;
        address token = listing.priceToken;

        uint256 commission = (price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = price - commission;

        IERC20(token).transferFrom(msg.sender, address(this), price);
        IERC20(token).transfer(seller, sellerAmount);

        record.owner = msg.sender;

        _removeFromOwner(seller, name);
        _addToOwner(msg.sender, name);

        if (keccak256(bytes(_primaryNames[seller])) == keccak256(bytes(name))) {
            delete _primaryNames[seller];
            emit PrimaryNameCleared(seller);
        }

        if (bytes(_primaryNames[msg.sender]).length == 0) {
            _primaryNames[msg.sender] = name;
            emit PrimaryNameSet(msg.sender, name);
        }

        _removeListing(name);

        emit NameSold(name, seller, msg.sender, price, commission, token);
        emit NameTransferred(name, seller, msg.sender);
    }

    function cleanExpiredListings(uint256 maxClean) external {
        uint256 cleaned = 0;
        uint256 i = 0;
        while (i < _listedNames.length && cleaned < maxClean) {
            string memory name = _listedNames[i];
            NameRecord storage record = _records[name];
            if (block.timestamp > record.expiry) {
                emit ListingCancelled(name, _listings[name].seller);
                _removeListing(name);
                cleaned++;
            } else {
                i++;
            }
        }
    }

    // ==================== View Functions ====================

    function getListing(string calldata name) external view returns (
        address seller,
        uint256 price,
        address priceToken,
        bool active
    ) {
        Listing storage listing = _listings[name];
        return (listing.seller, listing.price, listing.priceToken, listing.active);
    }

    function getListingCount() external view returns (uint256) {
        return _listedNames.length;
    }

    function getListedNameByIndex(uint256 index) external view returns (string memory) {
        if (index >= _listedNames.length) revert InvalidName();
        return _listedNames[index];
    }

    function getListings(uint256 offset, uint256 limit) external view returns (string[] memory names) {
        uint256 total = _listedNames.length;
        if (offset >= total) return new string[](0);

        uint256 count = limit;
        if (offset + count > total) count = total - offset;

        names = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            names[i] = _listedNames[offset + i];
        }
    }

    function getNameInfo(string calldata name) external view returns (
        address owner,
        uint256 expiry,
        bool isExpired,
        bool isAvailable
    ) {
        NameRecord storage record = _records[name];
        owner = record.owner;
        expiry = record.expiry;
        isExpired = record.owner != address(0) && block.timestamp > record.expiry;
        isAvailable = record.owner == address(0) || block.timestamp > record.expiry + GRACE_PERIOD;
    }

    function getMetadata(string calldata name, string calldata key) external view returns (string memory) {
        return _records[name].metadata[key];
    }

    function getRegistrationFee(string calldata name, uint256 years_) public view returns (uint256) {
        uint256 len = bytes(name).length;
        uint256 annualFee;

        if (len <= 3) {
            annualFee = yearlyFees[3];
        } else if (len == 4) {
            annualFee = yearlyFees[4];
        } else {
            annualFee = yearlyFees[5];
        }

        return annualFee * years_;
    }

    function isNameAvailable(string calldata name) external view returns (bool) {
        NameRecord storage record = _records[name];
        return record.owner == address(0) || block.timestamp > record.expiry + GRACE_PERIOD;
    }

    function getNamesOfOwner(address addr) external view returns (string[] memory) {
        return _ownedNames[addr];
    }

    function getNameCount(address addr) external view returns (uint256) {
        return _ownedNames[addr].length;
    }

    function getGracePeriodRemaining(string calldata name) external view returns (uint256) {
        NameRecord storage record = _records[name];
        if (record.owner == address(0)) return 0;
        if (block.timestamp <= record.expiry) return GRACE_PERIOD;
        uint256 graceEnd = record.expiry + GRACE_PERIOD;
        if (block.timestamp > graceEnd) return 0;
        return graceEnd - block.timestamp;
    }

    function getAcceptedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    function isTokenAccepted(address token) external view returns (bool) {
        return acceptedTokens[token];
    }

    // ==================== Admin ====================

    function addToken(address token) external onlyOwner {
        _addToken(token);
    }

    function removeToken(address token) external onlyOwner {
        if (!acceptedTokens[token]) revert TokenNotAccepted();
        acceptedTokens[token] = false;
        // Remove from tokenList
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
        emit TokenRemoved(token);
    }

    function setYearlyFee(uint8 charLen, uint256 fee) external onlyOwner {
        yearlyFees[charLen] = fee;
        emit YearlyFeeUpdated(charLen, fee);
    }

    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert FeeAboveMaximum();
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(newFee);
    }

    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner(), balance);
    }

    // ==================== Internal ====================

    function _addToken(address token) internal {
        if (token == address(0)) revert InvalidAddress();
        if (!acceptedTokens[token]) {
            acceptedTokens[token] = true;
            tokenList.push(token);
            emit TokenAdded(token);
        }
    }

    function _addToOwner(address addr, string memory name) internal {
        _ownedIndex[name] = _ownedNames[addr].length;
        _ownedNames[addr].push(name);
    }

    function _removeFromOwner(address addr, string memory name) internal {
        uint256 index = _ownedIndex[name];
        uint256 lastIndex = _ownedNames[addr].length - 1;

        if (index != lastIndex) {
            string memory lastName = _ownedNames[addr][lastIndex];
            _ownedNames[addr][index] = lastName;
            _ownedIndex[lastName] = index;
        }

        _ownedNames[addr].pop();
        delete _ownedIndex[name];
    }

    function _removeListing(string memory name) internal {
        uint256 index = _listedIndex[name];
        uint256 lastIndex = _listedNames.length - 1;

        if (index != lastIndex) {
            string memory lastName = _listedNames[lastIndex];
            _listedNames[index] = lastName;
            _listedIndex[lastName] = index;
        }

        _listedNames.pop();
        delete _listedIndex[name];
        delete _listings[name];
    }

    function _clearMetadata(string memory name) internal {
        NameRecord storage record = _records[name];
        for (uint256 i = 0; i < record.metadataKeys.length; i++) {
            delete record.metadata[record.metadataKeys[i]];
        }
        delete record.metadataKeys;
        emit MetadataCleared(name);
    }

    function _validateName(string calldata name) internal pure {
        bytes memory nameBytes = bytes(name);
        uint256 len = nameBytes.length;

        if (len < MIN_NAME_LENGTH || len > MAX_NAME_LENGTH) revert InvalidName();
        if (nameBytes[0] == 0x2D || nameBytes[len - 1] == 0x2D) revert InvalidName();

        for (uint256 i = 0; i < len; i++) {
            bytes1 c = nameBytes[i];
            bool isLower = (c >= 0x61 && c <= 0x7A);
            bool isDigit = (c >= 0x30 && c <= 0x39);
            bool isHyphen = (c == 0x2D);

            if (!isLower && !isDigit && !isHyphen) revert InvalidName();
        }
    }
}
