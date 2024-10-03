// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol"; // Import ERC20 interface

contract MintNFTs is ERC1155, Ownable {
    IERC20 public mrToken; // MR Token contract address

    constructor(address _mrToken) ERC1155("ipfs://QmQuqKLFCwgrbDTgfaXHoWFhTS3NqGdkvjHYDKZvYixjm2/{id}.json") Ownable(msg.sender) {
        mrToken = IERC20(_mrToken); // Set the MR Token contract address
    }

    event BatchMint(address indexed to, uint256[] ids, uint256[] amounts);
    event NFTsBought(address indexed buyer, uint256 id, uint256 amount, uint256 cost);

    
    function mintNFT(address to, uint256 id, uint256 amount) external {
        _mint(to, id, amount, "");
    }

    // Batch mint function
    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts) external onlyOwner {
        require(ids.length == amounts.length, "IDs and amounts length mismatch");
        _mintBatch(to, ids, amounts, "");
        emit BatchMint(to, ids, amounts);
    }

    // Buy NFTs function (Payable in MR Tokens)
    function BuyNFTs(address buyer, uint256 id, uint256 amount, uint256 costInMR) external {
        // Check if the buyer has enough MR tokens
        require(mrToken.balanceOf(buyer) >= costInMR, "Insufficient MR tokens");
        require(mrToken.allowance(buyer, address(this)) >= costInMR, "Allowance too low");
        
        // Transfer MR tokens from the buyer to the contract owner
        bool sent = mrToken.transferFrom(buyer, address(this), costInMR);
        require(sent, "MR token transfer failed");

        // Mint the specified amount of NFTs to the buyer's address
        _mint(buyer, id, amount, "");

        // Emit an event for logging
        emit NFTsBought(buyer, id, amount, costInMR);
    }

    // Function to withdraw MR tokens from the contract (onlyOwner)
    function withdrawMR() external onlyOwner {
        uint256 balance = mrToken.balanceOf(address(this));
        require(balance > 0, "No MR tokens to withdraw");
        mrToken.transfer(owner(), balance);
    }

    // Get the token URI
    function getTokenURI(uint256 tokenId) public pure returns (string memory) {
        return uri(tokenId);
    }

    // Override the URI function to properly replace {id} with tokenId
    function uri(uint256 tokenId) public pure override returns (string memory) {
        return string(abi.encodePacked(
            "ipfs://QmQuqKLFCwgrbDTgfaXHoWFhTS3NqGdkvjHYDKZvYixjm2/", 
            Strings.toString(tokenId),
            ".json"
        ));
    }
}
