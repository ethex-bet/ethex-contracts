const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');
const mineHelper = require("../helpers/MineHelper.js");

const EthexJackpot = artifacts.require("../contracts/EthexJackpot.sol");
const EthexOldJackpot = artifacts.require("../contracts/EthexTestOldJackpot.sol");

contract("Ethex Jackpot", async (accounts) => {

    let jackpotContract;
    
    let gasPrice = new BN('1');
    let minBetAmount = new BN('10000000000000000');
    
    let playerAccount = accounts[1];
    let hosterAccount = accounts[2];

    it("jackpot contract rises", async () => {

        let currentBlockNumber = (await web3.eth.getBlock('latest')).number;
        let lastJackpotBlockNumber = Math.ceil(currentBlockNumber / 5000) * 5000 - 5000;

        //console.log(`lastJackpotBlockNumber=${lastJackpotBlockNumber}`);

        let oldJackpot = await EthexOldJackpot.new();
        let jackpot = await EthexJackpot.new();

        await jackpot.setLoto(hosterAccount);
        await oldJackpot.setupUnprocessed(lastJackpotBlockNumber);
        await jackpot.setOldVersion(oldJackpot.address);

        let a = await jackpot.prevJackpots.call(lastJackpotBlockNumber, 0);
        //console.log(`previous ${lastJackpotBlockNumber} jp: start=${a.start.toString()} end=${a.end.toString()} processed=${a.processed.toString()}`);

        let numberEnd = await jackpot.numberEnd.call();
        let firstNumber = await jackpot.firstNumber.call();

        //console.log(`numberEnd=${numberEnd.toString()} firstNumber=${firstNumber.toString()}`);

        // Refill
        await jackpot.payIn.sendTransaction({ from: hosterAccount, value: minBetAmount.mul(new BN(1000)), gas: 300000, gasPrice: gasPrice });

        jackpotContract = jackpot;
        
        var lastBlock = await web3.eth.getBlock('latest');

        for (var i = lastBlock.number; i < 256; i++) 
            await mineHelper.advanceBlock();
    });
    
    it("registerTicket doesn't fail", async () => {
        let totalTikets = await jackpotContract.numberEnd.call();
        assert.equal(totalTikets.toString(), '1', 'Ticket counter is incorrect');

        let txResult = await jackpotContract.registerTicket.sendTransaction(createBetId(), playerAccount, { from: hosterAccount, gas: 3000000, gasPrice: gasPrice });

        totalTikets = await jackpotContract.numberEnd.call();
        assert.equal(totalTikets.toString(), '2', 'Ticket wasn\'t saved');
        truffleAssert.eventEmitted(txResult, 'Ticket');
    });

    it("settleJackpot doesn't fail", async () => {
        let txResult = await jackpotContract.settleJackpot.sendTransaction({ from: hosterAccount, gas: 3000000, gasPrice: gasPrice });
        truffleAssert.eventNotEmitted(txResult, 'Jackpot');
    });

    it("jackpot works", async () => {
        let currentBlockNumber = (await web3.eth.getBlock('latest')).number;
        let nextJackpotBlockNumber = Math.ceil(currentBlockNumber / 5000) * 5000;
        let edge = nextJackpotBlockNumber - currentBlockNumber;

        //console.log(`Current block=${currentBlockNumber} target=${nextJackpotBlockNumber} edge=${edge}`);

        for (var i = 0; i < edge + 1; i++)
            await mineHelper.advanceBlock();

        let txResult = await jackpotContract.settleJackpot.sendTransaction({ from: hosterAccount, gas: 3000000, gasPrice: gasPrice });

        truffleAssert.eventEmitted(txResult, 'Jackpot');
    });

    it("redrawing jackpot doesn't work", async () => {
        let txResult = await jackpotContract.settleJackpot.sendTransaction({ from: hosterAccount, gas: 3000000, gasPrice: gasPrice });
        truffleAssert.eventNotEmitted(txResult, 'Jackpot');
    });
});

function createBetId() {
    return '0x' + 'xxxxxxxxxxyxxxxxxxxxxxxyxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
