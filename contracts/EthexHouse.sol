pragma solidity 0.5.10;

/**
 * (E)t)h)e)x) House Contract 
 *  This smart-contract is the part of Ethex Lottery fair game.
 *  See latest version at https://github.com/ethex-bet/ethex-contracts 
 *  http://ethex.bet
 */
 
 import "./Ownable.sol";
 
 contract EthexHouse is Ownable {
    function payIn() external payable { }
    
    function withdraw() external onlyOwner {
        owner.transfer(address(this).balance);
    }
 }
