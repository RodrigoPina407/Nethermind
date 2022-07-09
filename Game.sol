pragma solidity ^0.8.0;
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol";

contract Game is ERC1155{

    uint private CHARACTER_ID = 0; //auto incremented everytime a character is created
    uint private INVENTORY_ID = 0; //auto incremented everytime an inventory is created

    mapping(uint256 => uint256) inventoryOwner; //keep track of character that owns the inventory
    mapping(uint256 => address) characterOwner; //keep track of account that owns character

    mapping(uint256 => bool) itemRegistry; //keep track of tokens
    mapping(uint256 => bool) nftRegistry; //keep track of nfts

    mapping(uint256 => uint256[]) inventoryItems; //map for inventoryId to items Ids array
    mapping(uint256 => uint256[]) inventoryItemsBalances; //map for inventoryId to items Balance array
    mapping(uint256 => mapping(uint256 => uint256)) inventoryItemsIndex; //map to keep track of items ids index

    modifier isItemRegistered(uint id){
        require(!itemRegistry[id], "this item is fungible");
        _;
    }

    modifier isItemNFT(uint id){
        require(!nftRegistry[id], "this item cannot be mint again");
        _;
    }

    modifier isInventoryOwner(address to, uint id){
        require(to == characterOwner[inventoryOwner[id]]);
        _;
    }

    modifier isCharacterOwner(uint id){
        require(characterOwner[id] == msg.sender, "not character owner");
        _;

    }

    modifier hasAmount(uint inventoryId, uint id, uint amount){
        uint index = inventoryItemsIndex[inventoryId][id];
        require(inventoryItemsBalances[inventoryId][index] >= amount, "not enough item balance");
        _;

    }

    constructor()ERC1155(""){
            
    }

    function createCharacter() public {
        CHARACTER_ID ++;
        characterOwner[CHARACTER_ID] = msg.sender;

    }

    function createInventory(uint characterId) public 
    isCharacterOwner(characterId)
    {

        INVENTORY_ID ++;
        inventoryOwner[INVENTORY_ID] = characterId;

        inventoryItems[INVENTORY_ID].push(0);          //push 0 value to first index    
        inventoryItemsBalances[INVENTORY_ID].push(0);  //push 0 value to first index

    }

    function transferInventory(uint inventoryId, uint dstCharacter) public 
    isInventoryOwner(msg.sender, inventoryId)
    {

     inventoryOwner[inventoryId] = dstCharacter;

     _safeBatchTransferFrom(msg.sender, characterOwner[dstCharacter],
     inventoryItems[inventoryId], inventoryItemsBalances[inventoryId], "");
    
    }

    function transferItem(uint inventoryId, uint dstInventoryId, uint id, uint amount) public
        isInventoryOwner(msg.sender, inventoryId)
        hasAmount(inventoryId, id, amount)
     {
         uint index_from = inventoryItemsIndex[inventoryId][id];
         uint index_to = inventoryItemsIndex[dstInventoryId][id];

         inventoryItemsBalances[inventoryId][index_from] -= amount; //update the sender balance

         if(index_to == 0)
         {
             inventoryItems[dstInventoryId].push(id);
             inventoryItemsBalances[dstInventoryId].push(amount);
             inventoryItemsIndex[dstInventoryId][id] = inventoryItems[dstInventoryId].length - 1;
         }
         else
         {
            inventoryItemsBalances[dstInventoryId][index_to] += amount; //update the destination balance
         }
         
        _safeTransferFrom(msg.sender, getInventoryOwner(dstInventoryId), id, amount, "");
         

    }

    function mintUniqueItem(address to, uint256 id, uint256 inventoryId) public 
    isInventoryOwner(to, inventoryId)
    isItemRegistered(id)
    {
            nftRegistry[id] = true;
            itemRegistry[id] = true;

            inventoryItems[inventoryId].push(id);
            inventoryItemsBalances[inventoryId].push(1);
            inventoryItemsIndex[inventoryId][id] = inventoryItems[inventoryId].length - 1;

            _mint(to, id, 1, "");
    }

    function mintItem(address to, uint256 id, uint256 amount, uint256 inventoryId) public
    isInventoryOwner(to,inventoryId)
    isItemNFT(id)
     {

        //if id has an index of 0 it means it was never minted before, so push to inventory
        if(inventoryItemsIndex[inventoryId][id] == 0)
        {
            itemRegistry[id] = true;

            inventoryItems[inventoryId].push(id);
            inventoryItemsBalances[inventoryId].push(amount);
            inventoryItemsIndex[inventoryId][id] = inventoryItems[inventoryId].length - 1;
        }
        else
        {
            uint index = inventoryItemsIndex[inventoryId][id];
            inventoryItemsBalances[inventoryId][index] += amount;
        }

        _mint(to,id,amount,"");

    }

    function getInventoryOwner(uint id) public view returns(address){
        return characterOwner[inventoryOwner[id]];
    }

    function getInventoryItemBalance(uint inventoryId, uint id) external view returns(uint){
        uint index = inventoryItemsIndex[inventoryId][id];

        return inventoryItemsBalances[inventoryId][index];
    }

}