// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// Custom Errors for WatchNFT
error NotAuthorizedWatchmaker();
error NotAuthorizedManufacturer();
error NFCEmpty();
error NFCAlreadyRegistered();
error NFCNotRegistered();
error TokenDoesNotExist();
error NotAuthorized();
error NotOwner();
error WatchAltered();
error WatchDestroyed();
error InvalidState();
error TransferBlocked();
error TokenLockedAdmin();
error NotAltered();
error SerialNumberNotRegistered();

/**
 * @title Axia Luxury Watch NFT Contract
 * @dev Implementation of the ERC-721 Token standard for physical watch authentication.
 * Integrates NFC UID hashing and role-based access control for manufacturers and watchmakers.
 */
contract WatchNFT is ERC721URIStorage, Ownable, Pausable {

    /// @dev Represents the physical and commercial status of the watch.
    enum WatchState { Active, Stolen, Lost, Destroyed, AlteredWatch }

    /// @dev Structure representing a maintenance or repair revision.
    struct Revision {
        uint256 date;
        address watchmaker;
        string description;
    }

    /// @dev Core data structure for each luxury watch.
    struct Watch {
        string brand;
        string model;
        string serialNumber;
        uint256 manufacturingYear;
        bytes32 hashUID; 
        WatchState state;
        address manufacturer;
    }   

    /// @dev Structure representing an authenticity verification event.
    struct Verification {
        address watchmaker;
        uint256 date;
        string comment;
    }

    // STATE VARIABLES
    uint256 public nextTokenId;
    address public marketplaceAddress;
    
    mapping(uint256 => Watch) public watches;
    mapping(uint256 => Revision[]) public watchRevisions;
    mapping(bytes32 => uint256) public nfcToTokenId; 
    mapping(address => bool) public authorizedManufacturers;
    mapping(address => bool) public authorizedWatchmakers;
    mapping(address => bool) public authorizedDealers;
    mapping(uint256 => bool) public isLocked;
    mapping(uint256 => Verification[]) public watchVerifications;
    mapping(string => uint256) public serialNumberToTokenId;
    mapping(uint256 => bytes32) public watchHashes;

    // EVENTS
    event WatchMinted(uint256 indexed tokenId, bytes32 hashUID, address indexed owner);
    event RevisionAdded(uint256 indexed tokenId, address indexed watchmaker);
    event SecurityStateChanged(uint256 indexed tokenId, WatchState newState);
    event TokenLocked(uint256 indexed tokenId, bool status);
    event WatchAuthenticityVerified(uint256 indexed tokenId, address indexed watchmaker, uint256 date, string comment);

    // MODIFIERS
    modifier onlyAuthorizedWatchmaker() {
        if (!authorizedWatchmakers[msg.sender]) revert NotAuthorizedWatchmaker();
        _;
    }

    modifier onlyAuthorizedManufacturer() {
        if (!authorizedManufacturers[msg.sender]) revert NotAuthorizedManufacturer();
        _;
    }

    /**
     * @notice Initializes the contract with name and symbol.
     */
    constructor() ERC721("AXIA Watch", "AXIA") Ownable(msg.sender) {}

    /**
     * @notice Mints a new Watch NFT and links it to a physical NFC chip hash.
     * @dev Only authorized manufacturers can call this function.
     * @param _brand Watch brand (e.g., Rolex, Citizen).
     * @param _model Watch model.
     * @param _serialNumber Unique serial number provided by the manufacturer.
     * @param _manufacturingYear Year the watch was manufactured.
     * @param _hashUID SHA-256 hash of the physical NFC UID.
     * @param _tokenURI IPFS URI containing metadata and images.
     * @param _recipient The address that will receive the minted NFT.
     * @return The Token ID of the newly minted watch.
     */
    function mintWatch(string memory _brand, string memory _model, string memory _serialNumber, uint256 _manufacturingYear, 
                       bytes32 _hashUID, string memory _tokenURI, address _recipient
    ) public onlyAuthorizedManufacturer whenNotPaused returns(uint256) {
        
        if (_hashUID == bytes32(0)) revert NFCEmpty(); 
        if (nfcToTokenId[_hashUID] != 0) revert NFCAlreadyRegistered();

        nextTokenId++;
        uint256 newItemId = nextTokenId;

        watches[newItemId] = Watch({
            brand: _brand,
            model: _model,
            serialNumber: _serialNumber,
            manufacturingYear: _manufacturingYear,
            hashUID: _hashUID,
            state: WatchState.Active,
            manufacturer: msg.sender 
        });

        nfcToTokenId[_hashUID] = newItemId;
        watchHashes[newItemId] = _hashUID;
        serialNumberToTokenId[_serialNumber] = newItemId;

        // Verificación de origen: el fabricante certifica la autenticidad en el momento del minteo
        watchVerifications[newItemId].push(Verification({
            watchmaker: msg.sender,
            date: block.timestamp,
            comment: "Certificado de fabricacion original. Reloj vinculado a chip NFC y registrado en blockchain por el fabricante."
        }));

        _safeMint(_recipient, newItemId);
        _setTokenURI(newItemId, _tokenURI);

        emit WatchMinted(newItemId, _hashUID, _recipient);
        emit WatchAuthenticityVerified(newItemId, msg.sender, block.timestamp, "Certificado de fabricacion original.");

        return newItemId;
    }

    /**
     * @dev Overrides ERC721 _update to restrict transfers based on WatchState and Locks.
     */
    function _update(address to, uint256 tokenId, address auth) internal override whenNotPaused returns (address) {
        if (auth != address(0) && to != address(0)) {
            if (watches[tokenId].state != WatchState.Active) revert TransferBlocked();
            if (isLocked[tokenId]) revert TokenLockedAdmin();
        }
        return super._update(to, tokenId, auth);
    }

    // ==========================================
    // ADMIN FUNCTIONS
    // ==========================================

    /**
     * @notice Adds or removes a watchmaker from the authorized whitelist.
     * @param _watchmaker Address of the watchmaker.
     * @param _status True to authorize, false to revoke.
     */
    function manageWatchmaker(address _watchmaker, bool _status) public onlyOwner {
        authorizedWatchmakers[_watchmaker] = _status;
    }

    /**
     * @notice Adds or removes a manufacturer from the authorized whitelist.
     * @param _manufacturer Address of the manufacturer.
     * @param _status True to authorize, false to revoke.
     */
    function manageManufacturer(address _manufacturer, bool _status) public onlyOwner {
        authorizedManufacturers[_manufacturer] = _status;
    }

    /**
     * @notice Adds or removes a dealer from the authorized whitelist.
     * @param _dealer Address of the dealer.
     * @param _status True to authorize, false to revoke.
     */
    function manageDealer(address _dealer, bool _status) public onlyOwner {
        authorizedDealers[_dealer] = _status;
    }

    /**
     * @notice Sets the official marketplace contract address.
     * @param _marketplaceAddress Address of the WatchMarketplace contract.
     */
    function setMarketplaceAddress(address _marketplaceAddress) public onlyOwner {
        marketplaceAddress = _marketplaceAddress;
    }

    /**
     * @notice Pauses all critical contract functions (Emergency stop).
     */
    function pauseContract() public onlyOwner { _pause(); }

    /**
     * @notice Resumes all critical contract functions.
     */
    function resumeContract() public onlyOwner { _unpause(); }

    /**
     * @notice Permanently destroys the NFT (e.g., if the physical watch is proven completely destroyed).
     * @param tokenId The ID of the watch to burn.
     */
    function burnWatch(uint256 tokenId) public onlyOwner {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        watches[tokenId].state = WatchState.Destroyed;
        _burn(tokenId);
    }

    /**
     * @notice Administratively locks or unlocks a specific token from being transferred.
     * @param tokenId The ID of the watch.
     * @param status True to lock, false to unlock.
     */
    function setLock(uint256 tokenId, bool status) external onlyOwner {
        isLocked[tokenId] = status;
        emit TokenLocked(tokenId, status);
    }

    /**
     * @notice Flags a watch as altered (tampered NFC, fake parts). Halts transfers.
     * @dev Callable only by the marketplace contract or the admin.
     * @param _tokenId The ID of the flagged watch.
     */
    function alteredWatch(uint256 _tokenId) external {
        if (!(msg.sender == marketplaceAddress || msg.sender == owner())) revert NotAuthorized();
        watches[_tokenId].state = WatchState.AlteredWatch;
        emit SecurityStateChanged(_tokenId, WatchState.AlteredWatch);
    }

    /**
     * @notice Updates the hash linked to a specific watch (e.g., physical NFC chip replacement).
     * @param _tokenId The ID of the watch.
     * @param _hash The new SHA-256 hash.
     */
    function setWatchHash(uint256 _tokenId, bytes32 _hash) public onlyOwner {
        watchHashes[_tokenId] = _hash;
        watches[_tokenId].hashUID = _hash;
    }

    /**
     * @notice Verifies if a provided hash matches the recorded hash for a specific token.
     * @param _tokenId The ID of the watch.
     * @param _hashEnviado The hash to check against the blockchain record.
     * @return True if hashes match, false otherwise.
     */
    function verifyHash(uint256 _tokenId, bytes32 _hashEnviado) public view returns (bool) {
        return watchHashes[_tokenId] == _hashEnviado;
    }
    
    // ==========================================
    // WATCHMAKER FUNCTIONS
    // ==========================================

    /**
     * @notice Records a physical maintenance or repair in the blockchain history.
     * @param _tokenId The ID of the serviced watch.
     * @param _description Details of the revision.
     */
    function addRevision(uint256 _tokenId, string memory _description) public onlyAuthorizedWatchmaker whenNotPaused {
        if (_ownerOf(_tokenId) == address(0)) revert TokenDoesNotExist();

        watchRevisions[_tokenId].push(Revision({
            date: block.timestamp, 
            watchmaker: msg.sender,
            description: _description
        }));
        emit RevisionAdded(_tokenId, msg.sender);
    }

    /**
     * @notice Logs the result of an authenticity check.
     * @param _tokenId The ID of the verified watch.
     * @param _comment Watchmaker's verdict or observations.
     */
    function verifyAuthenticity(uint256 _tokenId, string memory _comment) public onlyAuthorizedWatchmaker whenNotPaused {
        if (_ownerOf(_tokenId) == address(0)) revert TokenDoesNotExist();

        watchVerifications[_tokenId].push(Verification({
            watchmaker: msg.sender,
            date: block.timestamp,
            comment: _comment
        }));
        
        emit WatchAuthenticityVerified(_tokenId, msg.sender, block.timestamp, _comment); 
    }

    /**
     * @notice Restores a watch from the 'AlteredWatch' state back to 'Active' after proper physical repair.
     * @param _tokenId The ID of the restored watch.
     * @param _repairDescription Details of the repair that restored authenticity.
     */
    function restoreAuthenticity(uint256 _tokenId, string memory _repairDescription) public onlyAuthorizedWatchmaker whenNotPaused {
        if (_ownerOf(_tokenId) == address(0)) revert TokenDoesNotExist();
        if (watches[_tokenId].state != WatchState.AlteredWatch) revert NotAltered();

        watches[_tokenId].state = WatchState.Active;

        watchRevisions[_tokenId].push(Revision({
            date: block.timestamp,
            watchmaker: msg.sender,
            description: _repairDescription
        }));

        emit SecurityStateChanged(_tokenId, WatchState.Active);
    }

    // ==========================================
    // USER FUNCTIONS
    // ==========================================

    /**
     * @notice Allows the owner to report the watch as Stolen or Lost, or revert it to Active.
     * @dev State changes halt trading on the marketplace.
     * @param _tokenId The ID of the owned watch.
     * @param _newState The new desired state.
     */
    function changeSecurityState(uint256 _tokenId, WatchState _newState) public whenNotPaused {
        if (ownerOf(_tokenId) != msg.sender) revert NotOwner();
        
        if (watches[_tokenId].state == WatchState.AlteredWatch) revert WatchAltered();
        if (watches[_tokenId].state == WatchState.Destroyed) revert WatchDestroyed();

        if (!(_newState == WatchState.Stolen || _newState == WatchState.Lost || _newState == WatchState.Active)) {
            revert InvalidState();
        }

        watches[_tokenId].state = _newState;
        emit SecurityStateChanged(_tokenId, _newState);
    }

    // ==========================================
    // PUBLIC READ FUNCTIONS
    // ==========================================

    /**
     * @notice Retrieves the core data struct of a specific watch.
     * @param _tokenId The ID of the queried watch.
     * @return The Watch struct containing brand, model, state, etc.
     */
    function getWatchData(uint256 _tokenId) public view returns (Watch memory) {
        if (_ownerOf(_tokenId) == address(0)) revert TokenDoesNotExist();
        return watches[_tokenId];
    }

    /**
     * @notice Returns the wallet address of the manufacturer who minted the watch.
     * @param _tokenId The ID of the queried watch.
     * @return Address of the manufacturer.
     */
    function getWatchManufacturer(uint256 _tokenId) external view returns (address) {
        return watches[_tokenId].manufacturer;
    }

    /**
     * @notice Retrieves the full maintenance history of a watch.
     * @param _tokenId The ID of the queried watch.
     * @return An array of Revision structs.
     */
    function getRevisionHistory(uint256 _tokenId) public view returns (Revision[] memory) {
        if (_ownerOf(_tokenId) == address(0)) revert TokenDoesNotExist();
        return watchRevisions[_tokenId];
    }

    /**
     * @notice Resolves a physical NFC hash to its digital Token ID.
     * @param _hashUID The SHA-256 hash derived from the NFC UID.
     * @return The corresponding Token ID.
     */
    function getTokenByNFC(bytes32 _hashUID) public view returns (uint256) {
        uint256 tokenId = nfcToTokenId[_hashUID];
        if (tokenId == 0) revert NFCNotRegistered(); 
        return tokenId;
    } 

    /**
     * @notice Retrieves the full authenticity verification history of a watch.
     * @param _tokenId The ID of the queried watch.
     * @return An array of Verification structs.
     */
    function getVerificationHistory(uint256 _tokenId) public view returns (Verification[] memory) {
        if (_ownerOf(_tokenId) == address(0)) revert TokenDoesNotExist();
        return watchVerifications[_tokenId];
    }

    /**
     * @notice Retrieves the watch data using the manufacturer's serial number.
     * @param _serialNumber The physical serial number engraved on the watch.
     * @return The Watch struct.
     */
    function getWatchBySerialNumber(string memory _serialNumber) public view returns (Watch memory) {
        uint256 tokenId = serialNumberToTokenId[_serialNumber];
        if (tokenId == 0) revert SerialNumberNotRegistered();
        
        return watches[tokenId];
    }
}