// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TempoNameService is Ownable, ReentrancyGuard {
    // --- Types ---
    struct NameRecord {
        address owner;
        uint256 expiry;
        mapping(string => string) metadata;
        string[] metadataKeys; // track keys for cleanup
    }

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    // --- Constants ---
    uint256 public constant REGISTRATION_PERIOD = 365 days;
    uint256 public constant GRACE_PERIOD = 30 days;
    uint256 public constant MIN_NAME_LENGTH = 3;
    uint256 public constant MAX_NAME_LENGTH = 63;

    // --- State ---
    IERC20 public immutable paymentToken; // pathUSD
    mapping(string => NameRecord) private _records;
    mapping(address => string) private _primaryNames;
    mapping(uint8 => uint256) public yearlyFees; // charLength => fee

    // Owner name enumeration
    mapping(address => string[]) private _ownedNames;
    mapping(string => uint256) private _ownedIndex; // name => index in owner's array

    // Marketplace
    mapping(string => Listing) private _listings;
    string[] private _listedNames;
    mapping(string => uint256) private _listedIndex;
    uint256 public marketplaceFee = 250; // 2.5% (basis points)
    uint256 public constant FEE_DENOMINATOR = 10000;

    // --- Events ---
    event NameRegistered(string indexed name, address indexed owner, uint256 expiry);
    event NameRenewed(string indexed name, uint256 newExpiry);
    event NameTransferred(string indexed name, address indexed from, address indexed to);
    event PrimaryNameSet(address indexed owner, string name);
    event PrimaryNameCleared(address indexed owner);
    event MetadataSet(string indexed name, string key, string value);
    event MetadataCleared(string indexed name);
    event YearlyFeeUpdated(uint8 charLength, uint256 fee);
    event NameListed(string indexed name, address indexed seller, uint256 price);
    event ListingCancelled(string indexed name, address indexed seller);
    event NameSold(string indexed name, address indexed seller, address indexed buyer, uint256 price, uint256 fee);
    event MarketplaceFeeUpdated(uint256 newFee);

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

    constructor(address _paymentToken) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);

        // Default fees (pathUSD 6 decimals)
        yearlyFees[3] = 20 * 1e6;  // 3 char: $20/year
        yearlyFees[4] = 5 * 1e6;   // 4 char: $5/year
        yearlyFees[5] = 1 * 1e6;   // 5+ char: $1/year
    }

    // ==================== Registration ====================

    function register(string calldata name, uint256 years_) external nonReentrant {
        _validateName(name);
        if (years_ == 0) revert InvalidDuration();

        NameRecord storage record = _records[name];

        // Check availability: new name or expired past grace period
        bool isNewRegistration = record.owner == address(0);
        bool isExpiredPastGrace = !isNewRegistration && block.timestamp > record.expiry + GRACE_PERIOD;

        if (!isNewRegistration && !isExpiredPastGrace) {
            revert NameNotAvailable();
        }

        // If re-registering expired name, clean up old owner data
        if (isExpiredPastGrace) {
            _removeFromOwner(record.owner, name);
            _clearMetadata(name);
            // Cancel listing if exists
            if (_listings[name].active) {
                emit ListingCancelled(name, _listings[name].seller);
                _removeListing(name);
            }
        }

        // Collect payment
        uint256 fee = getRegistrationFee(name, years_);
        paymentToken.transferFrom(msg.sender, address(this), fee);

        // Set record
        record.owner = msg.sender;
        record.expiry = block.timestamp + (REGISTRATION_PERIOD * years_);

        // Add to owner's name list
        _addToOwner(msg.sender, name);

        // Auto-set primary name if owner has none
        if (bytes(_primaryNames[msg.sender]).length == 0) {
            _primaryNames[msg.sender] = name;
            emit PrimaryNameSet(msg.sender, name);
        }

        emit NameRegistered(name, msg.sender, record.expiry);
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

    function renew(string calldata name, uint256 years_) external nonReentrant {
        if (years_ == 0) revert InvalidDuration();
        NameRecord storage record = _records[name];
        if (record.owner == address(0)) revert NameExpired();
        if (block.timestamp > record.expiry + GRACE_PERIOD) revert NameExpired();

        uint256 fee = getRegistrationFee(name, years_);
        paymentToken.transferFrom(msg.sender, address(this), fee);

        uint256 baseTime = block.timestamp > record.expiry ? block.timestamp : record.expiry;
        record.expiry = baseTime + (REGISTRATION_PERIOD * years_);

        emit NameRenewed(name, record.expiry);
    }

    function transfer(string calldata name, address newOwner) external nonReentrant {
        if (newOwner == address(0)) revert InvalidAddress();

        NameRecord storage record = _records[name];
        if (record.owner != msg.sender) revert NotNameOwner();
        if (block.timestamp > record.expiry) revert NameExpired();

        // Cancel listing if listed
        if (_listings[name].active) {
            _removeListing(name);
            emit ListingCancelled(name, msg.sender);
        }

        address oldOwner = record.owner;
        record.owner = newOwner;

        // Update owner enumeration
        _removeFromOwner(oldOwner, name);
        _addToOwner(newOwner, name);

        // Clear sender's primary name if it was this name
        if (keccak256(bytes(_primaryNames[oldOwner])) == keccak256(bytes(name))) {
            delete _primaryNames[oldOwner];
            emit PrimaryNameCleared(oldOwner);
        }

        // Auto-set primary for receiver if none
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

        // Track new metadata keys
        if (bytes(record.metadata[key]).length == 0 && bytes(value).length > 0) {
            record.metadataKeys.push(key);
        }

        record.metadata[key] = value;
        emit MetadataSet(name, key, value);
    }

    // ==================== Marketplace ====================

    function listForSale(string calldata name, uint256 price) external {
        NameRecord storage record = _records[name];
        if (record.owner != msg.sender) revert NotNameOwner();
        if (block.timestamp > record.expiry) revert NameExpired();
        if (price == 0) revert InvalidPrice();

        Listing storage listing = _listings[name];

        // If not already listed, add to enumeration
        if (!listing.active) {
            _listedIndex[name] = _listedNames.length;
            _listedNames.push(name);
        }

        listing.seller = msg.sender;
        listing.price = price;
        listing.active = true;

        emit NameListed(name, msg.sender, price);
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

        // Calculate commission
        uint256 commission = (price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = price - commission;

        // Atomic payment: buyer sends full amount to contract first
        paymentToken.transferFrom(msg.sender, address(this), price);
        // Then contract pays seller
        paymentToken.transfer(seller, sellerAmount);

        // Transfer name ownership
        record.owner = msg.sender;

        // Update owner enumeration
        _removeFromOwner(seller, name);
        _addToOwner(msg.sender, name);

        // Clear seller's primary name if it was this name
        if (keccak256(bytes(_primaryNames[seller])) == keccak256(bytes(name))) {
            delete _primaryNames[seller];
            emit PrimaryNameCleared(seller);
        }

        // Auto-set primary for buyer if none
        if (bytes(_primaryNames[msg.sender]).length == 0) {
            _primaryNames[msg.sender] = name;
            emit PrimaryNameSet(msg.sender, name);
        }

        // Remove listing
        _removeListing(name);

        emit NameSold(name, seller, msg.sender, price, commission);
        emit NameTransferred(name, seller, msg.sender);
    }

    /// @notice Clean up expired listings from marketplace
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
                // Don't increment i — swap-and-pop moved a new name to index i
            } else {
                i++;
            }
        }
    }

    // ==================== View Functions ====================

    function getListing(string calldata name) external view returns (
        address seller,
        uint256 price,
        bool active
    ) {
        Listing storage listing = _listings[name];
        return (listing.seller, listing.price, listing.active);
    }

    function getListingCount() external view returns (uint256) {
        return _listedNames.length;
    }

    function getListedNameByIndex(uint256 index) external view returns (string memory) {
        if (index >= _listedNames.length) revert InvalidName();
        return _listedNames[index];
    }

    /// @notice Get paginated listings
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

    /// @notice Get all names owned by an address
    function getNamesOfOwner(address addr) external view returns (string[] memory) {
        return _ownedNames[addr];
    }

    /// @notice Get count of names owned by an address
    function getNameCount(address addr) external view returns (uint256) {
        return _ownedNames[addr].length;
    }

    /// @notice Get grace period remaining for an expired name (0 if not expired or past grace)
    function getGracePeriodRemaining(string calldata name) external view returns (uint256) {
        NameRecord storage record = _records[name];
        if (record.owner == address(0)) return 0;
        if (block.timestamp <= record.expiry) return GRACE_PERIOD;
        uint256 graceEnd = record.expiry + GRACE_PERIOD;
        if (block.timestamp > graceEnd) return 0;
        return graceEnd - block.timestamp;
    }

    // ==================== Admin ====================

    function setYearlyFee(uint8 charLen, uint256 fee) external onlyOwner {
        yearlyFees[charLen] = fee;
        emit YearlyFeeUpdated(charLen, fee);
    }

    function setMarketplaceFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert FeeAboveMaximum(); // max 10%
        marketplaceFee = newFee;
        emit MarketplaceFeeUpdated(newFee);
    }

    function withdraw() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        paymentToken.transfer(owner(), balance);
    }

    // ==================== Internal ====================

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
