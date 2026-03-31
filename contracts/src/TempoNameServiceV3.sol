// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

/// @title TempoNameServiceV3
/// @notice ERC-721 NFT name service with multi-token payments
/// @dev Each registered name mints an NFT. tokenId = uint256(keccak256(name))
contract TempoNameServiceV3 is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // --- Types ---
    struct NameRecord {
        string name;
        uint256 expiry;
        mapping(string => string) metadata;
        string[] metadataKeys;
    }

    struct Listing {
        address seller;
        uint256 price;
        address priceToken;
        bool active;
    }

    // --- Constants ---
    uint256 public constant REGISTRATION_PERIOD = 365 days;
    uint256 public constant GRACE_PERIOD = 30 days;
    uint256 public constant MIN_NAME_LENGTH = 3;
    uint256 public constant MAX_NAME_LENGTH = 63;

    // --- State ---
    string public tld; // "mpp", "agent", "ai", etc.

    mapping(address => bool) public acceptedTokens;
    address[] public tokenList;

    mapping(uint256 => NameRecord) private _records; // tokenId => record
    mapping(address => string) private _primaryNames;
    mapping(uint8 => uint256) public yearlyFees; // charLength => fee (6 decimals)

    // Marketplace
    mapping(uint256 => Listing) private _listings; // tokenId => listing
    string[] private _listedNames;
    mapping(string => uint256) private _listedIndex;
    uint256 public marketplaceFee = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;

    // --- Events ---
    event NameRegistered(string indexed name, address indexed owner, uint256 expiry, address token, uint256 tokenId);
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
    error TransferNotAllowed();

    constructor(
        string memory _tld,
        address _pathUSD,
        address _usdce,
        address _usdt0
    ) ERC721(
        string.concat("TempoID .", _tld),
        string.concat("TID-", _toUpper(_tld))
    ) Ownable(msg.sender) {
        tld = _tld;

        _addToken(_pathUSD);
        _addToken(_usdce);
        _addToken(_usdt0);

        // Default fees (6 decimals)
        yearlyFees[3] = 20 * 1e6;  // 3 char: $20/year
        yearlyFees[4] = 5 * 1e6;   // 4 char: $5/year
        yearlyFees[5] = 1 * 1e6;   // 5+ char: $1/year
    }

    // ==================== Token ID ====================

    function nameToTokenId(string memory name) public pure returns (uint256) {
        return uint256(keccak256(bytes(name)));
    }

    // ==================== Registration ====================

    function register(string calldata name, uint256 years_, address token) external nonReentrant {
        _validateName(name);
        if (years_ == 0) revert InvalidDuration();
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        uint256 tokenId = nameToTokenId(name);
        NameRecord storage record = _records[tokenId];

        bool isNewRegistration = bytes(record.name).length == 0;
        bool isExpiredPastGrace = !isNewRegistration && block.timestamp > record.expiry + GRACE_PERIOD;

        if (!isNewRegistration && !isExpiredPastGrace) {
            revert NameNotAvailable();
        }

        // Burn expired NFT if re-registering
        if (isExpiredPastGrace) {
            address oldOwner = _ownerOf(tokenId);
            if (oldOwner != address(0)) {
                _burn(tokenId);
            }
            _clearMetadata(tokenId, name);
            if (_listings[tokenId].active) {
                emit ListingCancelled(name, _listings[tokenId].seller);
                _removeListing(tokenId, name);
            }
        }

        uint256 fee = getRegistrationFee(name, years_);
        IERC20(token).transferFrom(msg.sender, address(this), fee);

        record.name = name;
        record.expiry = block.timestamp + (REGISTRATION_PERIOD * years_);

        // Mint NFT
        _mint(msg.sender, tokenId);

        if (bytes(_primaryNames[msg.sender]).length == 0) {
            _primaryNames[msg.sender] = name;
            emit PrimaryNameSet(msg.sender, name);
        }

        emit NameRegistered(name, msg.sender, record.expiry, token, tokenId);
    }

    // ==================== Resolution ====================

    function resolve(string calldata name) external view returns (address) {
        uint256 tokenId = nameToTokenId(name);
        NameRecord storage record = _records[tokenId];
        if (bytes(record.name).length == 0 || block.timestamp > record.expiry) {
            revert NameExpired();
        }
        return ownerOf(tokenId);
    }

    function reverseLookup(address addr) external view returns (string memory) {
        string memory name = _primaryNames[addr];
        if (bytes(name).length == 0) revert NoPrimaryName();

        uint256 tokenId = nameToTokenId(name);
        NameRecord storage record = _records[tokenId];
        if (block.timestamp > record.expiry) revert NameExpired();

        return name;
    }

    // ==================== Management ====================

    function renew(string calldata name, uint256 years_, address token) external nonReentrant {
        if (years_ == 0) revert InvalidDuration();
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        uint256 tokenId = nameToTokenId(name);
        NameRecord storage record = _records[tokenId];
        if (bytes(record.name).length == 0) revert NameExpired();
        if (block.timestamp > record.expiry + GRACE_PERIOD) revert NameExpired();

        uint256 fee = getRegistrationFee(name, years_);
        IERC20(token).transferFrom(msg.sender, address(this), fee);

        uint256 baseTime = block.timestamp > record.expiry ? block.timestamp : record.expiry;
        record.expiry = baseTime + (REGISTRATION_PERIOD * years_);

        emit NameRenewed(name, record.expiry, token);
    }

    function transfer(string calldata name, address newOwner) external nonReentrant {
        if (newOwner == address(0)) revert InvalidAddress();

        uint256 tokenId = nameToTokenId(name);
        if (ownerOf(tokenId) != msg.sender) revert NotNameOwner();

        NameRecord storage record = _records[tokenId];
        if (block.timestamp > record.expiry) revert NameExpired();

        if (_listings[tokenId].active) {
            _removeListing(tokenId, name);
            emit ListingCancelled(name, msg.sender);
        }

        address oldOwner = msg.sender;

        // Transfer NFT (this updates ownerOf)
        _transfer(oldOwner, newOwner, tokenId);

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
        uint256 tokenId = nameToTokenId(name);
        if (ownerOf(tokenId) != msg.sender) revert NotNameOwner();

        NameRecord storage record = _records[tokenId];
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
        uint256 tokenId = nameToTokenId(name);
        if (ownerOf(tokenId) != msg.sender) revert NotNameOwner();

        NameRecord storage record = _records[tokenId];
        if (block.timestamp > record.expiry) revert NameExpired();

        if (bytes(record.metadata[key]).length == 0 && bytes(value).length > 0) {
            record.metadataKeys.push(key);
        }

        record.metadata[key] = value;
        emit MetadataSet(name, key, value);
    }

    // ==================== Marketplace ====================

    function listForSale(string calldata name, uint256 price, address token) external {
        uint256 tokenId = nameToTokenId(name);
        if (ownerOf(tokenId) != msg.sender) revert NotNameOwner();

        NameRecord storage record = _records[tokenId];
        if (block.timestamp > record.expiry) revert NameExpired();
        if (price == 0) revert InvalidPrice();
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        Listing storage listing = _listings[tokenId];

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
        uint256 tokenId = nameToTokenId(name);
        Listing storage listing = _listings[tokenId];
        if (!listing.active) revert NotListed();
        if (listing.seller != msg.sender) revert NotNameOwner();

        _removeListing(tokenId, name);
        emit ListingCancelled(name, msg.sender);
    }

    function buyName(string calldata name) external nonReentrant {
        uint256 tokenId = nameToTokenId(name);
        Listing storage listing = _listings[tokenId];
        if (!listing.active) revert NotListed();

        NameRecord storage record = _records[tokenId];
        if (block.timestamp > record.expiry) revert NameExpired();
        if (msg.sender == listing.seller) revert CannotBuyOwnName();

        uint256 price = listing.price;
        address seller = listing.seller;
        address token = listing.priceToken;

        uint256 commission = (price * marketplaceFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = price - commission;

        IERC20(token).transferFrom(msg.sender, address(this), price);
        IERC20(token).transfer(seller, sellerAmount);

        // Transfer NFT
        _transfer(seller, msg.sender, tokenId);

        if (keccak256(bytes(_primaryNames[seller])) == keccak256(bytes(name))) {
            delete _primaryNames[seller];
            emit PrimaryNameCleared(seller);
        }

        if (bytes(_primaryNames[msg.sender]).length == 0) {
            _primaryNames[msg.sender] = name;
            emit PrimaryNameSet(msg.sender, name);
        }

        _removeListing(tokenId, name);

        emit NameSold(name, seller, msg.sender, price, commission, token);
        emit NameTransferred(name, seller, msg.sender);
    }

    function cleanExpiredListings(uint256 maxClean) external {
        uint256 cleaned = 0;
        uint256 i = 0;
        while (i < _listedNames.length && cleaned < maxClean) {
            string memory name = _listedNames[i];
            uint256 tokenId = nameToTokenId(name);
            NameRecord storage record = _records[tokenId];
            if (block.timestamp > record.expiry) {
                emit ListingCancelled(name, _listings[tokenId].seller);
                _removeListing(tokenId, name);
                cleaned++;
            } else {
                i++;
            }
        }
    }

    // ==================== ERC-721 Overrides ====================

    /// @notice On-chain SVG metadata for NFT marketplaces
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        NameRecord storage record = _records[tokenId];
        string memory name = record.name;
        string memory fullName = string.concat(name, ".", tld);
        bool isExpired = block.timestamp > record.expiry;

        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="#0a0a0a"/>',
            '<text x="200" y="180" font-family="serif" font-size="32" fill="white" text-anchor="middle">',
            fullName,
            '</text>',
            '<text x="200" y="230" font-family="monospace" font-size="14" fill="#888" text-anchor="middle">',
            isExpired ? "EXPIRED" : string.concat("Expires ", _formatTimestamp(record.expiry)),
            '</text>',
            '<text x="200" y="370" font-family="monospace" font-size="12" fill="#444" text-anchor="middle">TempoID</text>',
            '</svg>'
        );

        string memory json = string.concat(
            '{"name":"', fullName,
            '","description":"TempoID name on Tempo blockchain (.', tld, ')",',
            '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes":[',
                '{"trait_type":"TLD","value":"', tld, '"},',
                '{"trait_type":"Length","value":"', bytes(name).length.toString(), '"},',
                '{"trait_type":"Status","value":"', isExpired ? "Expired" : "Active", '"}',
            ']}'
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    /// @dev Prevent direct ERC-721 transfers — must use transfer() or marketplace
    ///      This ensures primary name bookkeeping stays in sync
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ==================== View Functions ====================

    function getListing(string calldata name) external view returns (
        address seller,
        uint256 price,
        address priceToken,
        bool active
    ) {
        uint256 tokenId = nameToTokenId(name);
        Listing storage listing = _listings[tokenId];
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
        uint256 tokenId = nameToTokenId(name);
        NameRecord storage record = _records[tokenId];

        if (bytes(record.name).length == 0) {
            return (address(0), 0, false, true);
        }

        owner = _ownerOf(tokenId);
        expiry = record.expiry;
        isExpired = block.timestamp > record.expiry;
        isAvailable = owner == address(0) || block.timestamp > record.expiry + GRACE_PERIOD;
    }

    function getMetadata(string calldata name, string calldata key) external view returns (string memory) {
        uint256 tokenId = nameToTokenId(name);
        return _records[tokenId].metadata[key];
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
        uint256 tokenId = nameToTokenId(name);
        NameRecord storage record = _records[tokenId];
        if (bytes(record.name).length == 0) return true;
        return block.timestamp > record.expiry + GRACE_PERIOD;
    }

    function getNamesOfOwner(address addr) external view returns (string[] memory) {
        uint256 count = balanceOf(addr);
        string[] memory names = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(addr, i);
            names[i] = _records[tokenId].name;
        }
        return names;
    }

    function getNameCount(address addr) external view returns (uint256) {
        return balanceOf(addr);
    }

    function getGracePeriodRemaining(string calldata name) external view returns (uint256) {
        uint256 tokenId = nameToTokenId(name);
        NameRecord storage record = _records[tokenId];
        if (bytes(record.name).length == 0) return 0;
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

    /// @notice Get the name associated with a token ID
    function nameOfToken(uint256 tokenId) external view returns (string memory) {
        _requireOwned(tokenId);
        return _records[tokenId].name;
    }

    // ==================== Admin ====================

    function addToken(address token) external onlyOwner {
        _addToken(token);
    }

    function removeToken(address token) external onlyOwner {
        if (!acceptedTokens[token]) revert TokenNotAccepted();
        acceptedTokens[token] = false;
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

    function _removeListing(uint256 tokenId, string memory name) internal {
        uint256 index = _listedIndex[name];
        uint256 lastIndex = _listedNames.length - 1;

        if (index != lastIndex) {
            string memory lastName = _listedNames[lastIndex];
            _listedNames[index] = lastName;
            _listedIndex[lastName] = index;
        }

        _listedNames.pop();
        delete _listedIndex[name];
        delete _listings[tokenId];
    }

    function _clearMetadata(uint256 tokenId, string memory name) internal {
        NameRecord storage record = _records[tokenId];
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

    function _toUpper(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        for (uint256 i = 0; i < bStr.length; i++) {
            if (bStr[i] >= 0x61 && bStr[i] <= 0x7A) {
                bStr[i] = bytes1(uint8(bStr[i]) - 32);
            }
        }
        return string(bStr);
    }

    function _formatTimestamp(uint256 ts) internal pure returns (string memory) {
        return ts.toString();
    }
}
