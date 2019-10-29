const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');
const mineHelper = require("../helpers/MineHelper.js");

const EthexSuperprize = artifacts.require("../contracts/EthexSuperprize.sol");

contract("Ethex Superprize", async (accounts) => {

    let superprizeContract;
    let oldSuperprizeContract;
    
    let gasPrice = new BN('1');
    let minBetAmount = new BN('10000000000000000');

    let ownerAccount = accounts[0];
    let playerAccount = accounts[1];
    let hosterAccount = accounts[2];

    it("superprize contract rises", async () => {

        //console.log(`lastJackpotBlockNumber=${lastJackpotBlockNumber}`);

        let oldSuperprize = await EthexSuperprize.new();
        let superprize = await EthexSuperprize.new();

        await oldSuperprize.setLoto(accounts[0]);
        await superprize.setLoto(accounts[0]);

        // refill
        await oldSuperprize.sendTransaction({ from: hosterAccount, value: minBetAmount.mul(new BN(1000)), gas: 300000, gasPrice: gasPrice });
        await superprize.sendTransaction({ from: hosterAccount, value: minBetAmount.mul(new BN(1000)), gas: 300000, gasPrice: gasPrice });

        oldSuperprizeContract = oldSuperprize;
        superprizeContract = superprize;
        
        var lastBlock = await web3.eth.getBlock('latest');

        for (var i = lastBlock.number; i < 256; i++) 
            await mineHelper.advanceBlock();
    });

    it("superprize migration works", async () => {

        let initialSuperprizeBalance = new BN(await web3.eth.getBalance(superprizeContract.address));
        let oldSuperprizeBalance = new BN(await web3.eth.getBalance(oldSuperprizeContract.address));

        await oldSuperprizeContract.setNewVersion.sendTransaction(superprizeContract.address, { from: ownerAccount, gas: 3000000, gasPrice: 0 });
        let txResult = await superprizeContract.setOldVersion.sendTransaction(oldSuperprizeContract.address, { from: ownerAccount, gas: 3000000, gasPrice: 0 });

        let currentSuperprizeBalance = new BN(await web3.eth.getBalance(superprizeContract.address));

        assert.equal(currentSuperprizeBalance.sub(initialSuperprizeBalance).toString(), oldSuperprizeBalance.toString(), 'Migration doesn\'t transfer whole amount');
    });

    it("superprize: initSuperprize", async () => {
        let txResult = await superprizeContract.initSuperprize.sendTransaction(playerAccount, createBetId(), { from: ownerAccount, gas: 3000000, gasPrice: gasPrice });
        
        truffleAssert.eventEmitted(txResult, 'Superprize');
    });

    it("superprize: paySuperprize (no action)", async () => {
        let initialSuperprizeBalance = new BN(await web3.eth.getBalance(superprizeContract.address));
        let initialPlayerBalance = new BN(await web3.eth.getBalance(playerAccount));

        await superprizeContract.paySuperprize.sendTransaction({ from: ownerAccount, gas: 3000000, gasPrice: 0 });

        let currentSuperprizeBalance = new BN(await web3.eth.getBalance(superprizeContract.address));
        let currentPlayerBalance = new BN(await web3.eth.getBalance(playerAccount));

        assert.notEqual(initialPlayerBalance.add(initialSuperprizeBalance).toString(), currentPlayerBalance.toString(), 'paySuperprize didn\'t create payout');
        assert.notEqual(currentSuperprizeBalance.toString(), '0', 'paySuperprize didn\'t transfer whole amount');
    });

    /*
     * ƒ‡ÌÌ˚È ÚÂÒÚ Á‡ÌËÏ‡ÂÚ ÓÚ 5 ˜‡ÒÓ‚ ‚ÂÏÂÌË Ë ÚÂ·ÛÂÚ ÒÓÓÚ‚ÂÚÒÚ‚Û˛˘ËÂ Ì‡ÒÚÓÈÍË Ú‡ÈÏ‡ÛÚ‡ mocha
     * 
    it("superprize: paySuperprize (success)", async () => {
        
        for (var i = 0; i < 150001; i++)
            await mineHelper.advanceBlock();

        let txResult = await superprizeContract.paySuperprize.sendTransaction({ from: ownerAccount, gas: 3000000, gasPrice: 0 });

        truffleAssert.eventEmitted(txResult, 'Superprize');
    });
    */
});

function createBetId() {
    return '0x' + 'xxxxxxxxxxyxxxxxxxxxxxxyxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
