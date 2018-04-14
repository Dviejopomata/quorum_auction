pragma solidity ^0.4.21;

import "./SimpleAuction.sol";

contract FactoryAuction {

    mapping( address => address[]) public auctions;

    event NewAuction(address newAuction, string name, uint biddingTime);

    function createAuction(string _name, uint _biddingTime) public returns (address auctionAddress) {
        address owner = msg.sender;
        SimpleAuction newAuction = new SimpleAuction(_name, _biddingTime, owner);
        auctions[owner].push(newAuction);
        emit NewAuction(newAuction, _name, _biddingTime);
        return newAuction;
    }

    function getAuctionAddress( address auctioneer) public returns (address[] auctionAddress) {
        //do some sanity
        return auctions[auctioneer];
    }
}