pragma solidity ^0.4.4;

// import "./C1.sol";

contract HelloWorld {
    address private creator;
    address private lastCaller;
    string private message;
    uint private totalGas;

    function HelloWorld()  public {
        creator = msg.sender;
        totalGas = msg.gas;
        message = "hello world";
    }
    //Begin: getters
    function getMessage() public constant returns(string) {
        return message;
    }

    function getLastCaller() public constant returns(address) {
        return lastCaller;
    }

    function getCreator() public constant returns(address) {
        return creator;
    }

    function getTotalGas() public constant returns(uint) {
        return totalGas;
    }
    //End: getters
    // function getC1(address addrC1) public pure returns (uint) {
    //     C1 c1 = C1(addrC1);
    //     return c1.f1();
    // }
    // function sum(address addrC1, uint n1, uint n2) public pure returns(uint) {
    //     C1 c1 = C1(addrC1);
    //     return c1.sum(n1,n2);
    // }
    //Being: setters
    function setMessage(string newMessage) public {
        message = newMessage;
        lastCaller = msg.sender;
        totalGas += tx.gasprice;
    }
    //End: setters
}
