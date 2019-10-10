const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');
const mineHelper = require("../helpers/MineHelper.js");

const EthexLoto = artifacts.require("../contracts/EthexLoto.sol");
const EthexJackpot = artifacts.require("../contracts/EthexJackpot.sol");
const EthexHouse = artifacts.require("../contracts/EthexHouse.sol");
const EthexSuperprize = artifacts.require("../contracts/EthexSuperprize.sol");

contract("Ethex Loto", async (accounts) => {

	let lotoContract;
	let jackpotContract;

	let emptyCombination = [255, 255, 255, 255, 255, 255];
	let allEvenCombination = [19, 19, 19, 19, 19, 19];
	let allNotEvenCombination = [18, 18, 18, 18, 18, 18];
	let allNumberCombination = [17, 17, 17, 17, 17, 17];
	let allNotNumberCombination = [16, 16, 16, 16, 16, 16];

	let incorrectCombination = [250, 250, 250, 250, 250, 250];
	let partlyIncorrectCombination1 = [250, 250, 250, 255, 255, 255];
	let partlyIncorrectCombination2 = [250, 250, 250, 250, 250, 17];

	let gasPrice = new BN('1');
	let minBetAmount = new BN('10000000000000000');
	let oneEth = new BN('1000000000000000000');

	let playerAccount = accounts[0];
	let hosterAccount = accounts[1];

	let txTestAmount = 10;

	const deploy = async function () {

		let jackpot = await EthexJackpot.new();
		let house = await EthexHouse.new();
		let superprize = await EthexSuperprize.new();
		let loto = await EthexLoto.new(jackpot.address, house.address, superprize.address);
		
		await jackpot.setLoto(loto.address);
		await superprize.setLoto(loto.address);

		// Refill
		await loto.payIn.sendTransaction({ from: hosterAccount, value: minBetAmount.mul(new BN(1000)), gas: 300000, gasPrice: gasPrice });

		lotoContract = loto;
		jackpotContract = jackpot;

		// Contract requires at least 256 block in chain
		var lastBlock = await web3.eth.getBlock('latest');

		for (var i = lastBlock.number; i < 256; i++) 
			await mineHelper.advanceBlock();
	};

	let simpleBetTest = async function (id, combination, amount) {
		let initialBalance = new BN(await web3.eth.getBalance(playerAccount));
		let encodedCombination = encodeCombination(combination);

		// Placing bet
		let placeBetTx = await lotoContract.placeBet.sendTransaction(`${id}${encodedCombination}`, { from: playerAccount, value: amount, gas: 3000000, gasPrice: gasPrice });
		let placeBetCost = new BN(placeBetTx.receipt.gasUsed).mul(gasPrice);

		// Bet block
		let betBlock = await web3.eth.getBlock('latest');

		// Draw
		let drawTx = await lotoContract.settleBets.sendTransaction({ from: playerAccount, value: 0, gas: 3000000, gasPrice: gasPrice });
		let drawCost = new BN(drawTx.receipt.gasUsed).mul(gasPrice);

		let afterwardBalance = new BN(await web3.eth.getBalance(playerAccount));
		let winAmount = afterwardBalance.sub(initialBalance).add(placeBetCost).add(drawCost).add(amount);

		// Check Payout
		truffleAssert.eventEmitted(drawTx, 'PayoutBet', (ev) => {
			assert.equal(ev.amount.toString(), winAmount.toString(), 'Payout amount is not correct');
			return true;
		}, 'Payout is not correct');

		// win check
		let markedCount = 0;

		for (let i = 0; i < combination.length; i++)
			if (combination[i] <= 19)
				markedCount++;

		let winCoefficient = new BN(calculateBetWinCoefficient(betBlock.hash, combination));
		let calculatedWinAmount = amount
			.mul(new BN(8)).div(new BN(10))	                        // 0.8 from bet amount: 0.2 takes as fees
			.mul(winCoefficient).div(new BN('100000000000000000'))  // wincoefficient
			.div(new BN(markedCount));                              // applies markedCount

		//console.log(`Win check: markedCount=${markedCount} winCoefficient=${winCoefficient.toString()} calculatedWinAmount=${calculatedWinAmount.toString()}`);

		truffleAssert.eventEmitted(drawTx, 'PayoutBet', (ev) => {
			assert.equal(ev.amount.toString(), calculatedWinAmount.toString(), 'Payout amount is not correct');
			return true;
		}, 'Payout is not correct');
	};

	beforeEach(deploy);
	
	it("placebet doesn't fail", async () => {
		// Bet
		let betId = createBetId();
		let combination = getRandomCombination();
		let encodedCombination = encodeCombination(combination);
		let param = `${betId}${encodedCombination}`;

		await lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice });

		let totalBets = await lotoContract.length.call();

		assert.notEqual(totalBets, 0, 'Bet wasn\'t saved');
	});

	it("settlebets doesn't fail (without bets)", async () => {
		await lotoContract.settleBets.sendTransaction({ from: playerAccount, value: 0, gas: 3000000, gasPrice: gasPrice });
	});

	it("settlebets doesn't fail (with bets)", async () => {
		await simpleBetTest(createBetId(), getRandomCombination(), minBetAmount);
	});

	it("bets with empty params is prohibited", async () => {
		let value = [];

		for (let i = 0; i < 22; i++)
			value.push(0x00);

		await truffleAssert.reverts(
			lotoContract.placeBet.sendTransaction(value, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice })
		);
	});

	it("bets with no id is prohibited", async () => {
		let betId = '0x00000000000000000000000000000000';
		let combination = getRandomCombination();
		let encodedCombination = encodeCombination(combination);
		let param = `${betId}${encodedCombination}`;

		await truffleAssert.reverts(
			lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice }),
			'Id should not be 0'
		);
	});

	it("bets with empty combination is prohibited", async () => {
		let betId = createBetId();
		let combination = emptyCombination;
		let encodedCombination = encodeCombination(combination);
		let param = `${betId}${encodedCombination}`;

		await truffleAssert.fails(
			lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice })
		);
	});

	it("bet with totally incorrect combination fails", async () => {
		let betId = createBetId();
		let encodedCombination = encodeCombination(incorrectCombination);
		let param = `${betId}${encodedCombination}`;

		await truffleAssert.fails(
			lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice })
		);
	});

	it("bet with partly incorrect combination fails (no significant fields)", async () => {
		let betId = createBetId();
		let encodedCombination = encodeCombination(partlyIncorrectCombination1);
		let param = `${betId}${encodedCombination}`;

		await truffleAssert.fails(
			lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice })
		);
	});

	it(`bets with partly incorrect combination works (one significant field)`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), partlyIncorrectCombination2, minBetAmount);
	});

	it(`${txTestAmount} draws for random bets with 1 symbol are correct`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), getRandomCombination(1, true), minBetAmount);
	});

	it(`${txTestAmount} draws for random bets with 2 symbol are correct`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), getRandomCombination(2, true), minBetAmount);
	});

	it(`${txTestAmount} draws for random bets with 3 symbol are correct`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), getRandomCombination(3, true), minBetAmount);
	});

	it(`${txTestAmount} draws for random bets with 4 symbol are correct`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), getRandomCombination(4, true), minBetAmount);
	});

	it(`${txTestAmount} draws for random bets with 5 symbol are correct`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), getRandomCombination(5, true), minBetAmount);
	});

	it(`${txTestAmount} draws for random bets with 6 symbol are correct`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), getRandomCombination(), minBetAmount);
	});
	
	it(`${txTestAmount} draws for all even bets are correct`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), allEvenCombination, minBetAmount);
	});

	it(`${txTestAmount} draws for all odd bets are correct`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), allNotEvenCombination, minBetAmount);
	});

	it(`drawing ${txTestAmount} all numbers bets`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), allNumberCombination, minBetAmount);
	});

	it(`drawing ${txTestAmount} all letters bets`, async () => {
		for (var i = 0; i < txTestAmount; i++)
			await simpleBetTest(createBetId(), allNotNumberCombination, minBetAmount);
	});
	
	it(`Draw generates refund if bet is too old`, async () => {
		let id = createBetId();
		let combination = getRandomCombination();
		let amount = minBetAmount;
		let encodedCombination = encodeCombination(combination);

		// Placing bet
		await lotoContract.placeBet.sendTransaction(`${id}${encodedCombination}`, { from: playerAccount, value: amount, gas: 3000000, gasPrice: gasPrice });

		for (var i = 0; i < 256; i++)
			await mineHelper.advanceBlock();

		// Draw
		let drawTx = await lotoContract.settleBets.sendTransaction({ from: playerAccount, value: 0, gas: 3000000, gasPrice: gasPrice });
		
		// Check Payout
		truffleAssert.eventEmitted(drawTx, 'RefundBet', (ev) => {
			assert.equal(ev.amount.toString(), amount.mul(new BN(8)).div(new BN(10)).toString(), 'RefundBet amount is not correct');
			return true;
		}, 'Refund is not correct');
	});

	it("bets with amount less then minimal is prohibited", async () => {
		let betId = createBetId();
		let combination = getRandomCombination();
		let encodedCombination = encodeCombination(combination);
		let param = `${betId}${encodedCombination}`;

		await truffleAssert.reverts(
			lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount.sub(new BN(1)), gas: 3000000, gasPrice: gasPrice }),
			'Bet amount should be greater or equal than minimal amount'
		);
	});
	
	it("placebet should not create jackpot ticket for bets with one cell", async () => {
		let betId = createBetId();
		let combination = getRandomCombination(1, true);
		let encodedCombination = encodeCombination(combination);
		let param = `${betId}${encodedCombination}`;

		let tx = await lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice });
		let txResult = await truffleAssert.createTransactionResult(jackpotContract, tx.tx);

		truffleAssert.eventNotEmitted(txResult, 'Ticket');
	});
	
	it("placebet should create jackpot ticket for bets with more then one cell", async () => {
		let betId = createBetId();
		let combination = getRandomCombination(2, true);
		let encodedCombination = encodeCombination(combination);
		let param = `${betId}${encodedCombination}`;

		let tx = await lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice });
		let txResult = await truffleAssert.createTransactionResult(jackpotContract, tx.tx);

		truffleAssert.eventEmitted(txResult, 'Ticket');
	});
	

	it("settleBets should process 10 bets", async () => {
		let betsCounterOne = await lotoContract.length.call();

		for (var i = 0; i < 11; i++) {
			let combination = getRandomCombination(2, true);
			let encodedCombination = encodeCombination(combination);
			let param = `${createBetId()}${encodedCombination}`;

			await lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice });
		}

		let betsCounterTwo = await lotoContract.length.call();
		await lotoContract.settleBets.sendTransaction({ from: playerAccount, value: 0, gas: 3000000, gasPrice: gasPrice });
		let betsCounterThree = await lotoContract.length.call();

		//console.log(`Counters: ${betsCounterOne} ${betsCounterTwo} ${betsCounterThree}`);

		assert.equal(betsCounterThree, 1, 'settleBets didn\'t process 10 tx');
	});

	it('placeBet should fail if there is not enough eth on contract', async () => {
		let jackpot = await EthexJackpot.new();
		let house = await EthexHouse.new();
		let superprize = await EthexSuperprize.new();
		let loto = await EthexLoto.new(jackpot.address, house.address, superprize.address);

		await jackpot.setLoto(loto.address);
		await superprize.setLoto(loto.address);

		let combination = getRandomCombination();
		let encodedCombination = encodeCombination(combination);
		let param = `${createBetId()}${encodedCombination}`;

		await truffleAssert.fails(
			loto.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount, gas: 3000000, gasPrice: gasPrice })
		);
	});
	
	it('placeBet should fail if bet amount is greater then max win amount', async () => {
		let combination = getRandomCombination();
		let encodedCombination = encodeCombination(combination);
		let param = `${createBetId()}${encodedCombination}`;

		// min amount - fee + 6 eth
		await truffleAssert.fails(
			lotoContract.placeBet.sendTransaction(param, { from: playerAccount, value: minBetAmount.mul(new BN(8)).div(new BN(10)).add(new BN('6000000000000000000')), gas: 3000000, gasPrice: gasPrice })
		);
	});

});

function getRandomCombination(fields = 6, allSignificant = false, undefinedShift = 6) {
	let combination = [];

	for (let i = 0; i < 6; i++) {
		if (fields > 0) {
			let randNumber = Math.floor(Math.random() * (19 + (allSignificant ? 0 : undefinedShift))) + 1;
			randNumber = randNumber > 19 ? 255 : randNumber;
			combination.push(randNumber);
			fields--;
		}
		else
			combination.push(255);
	}

	return combination;
}

function encodeCombination(combination) {
	return combination.map(value => value.toString(16).padStart(2, '0')).join('');
}

function calculateBetWinCoefficient(hash, combination) {
	let lastSymbols = hash.substring(hash.length - 6);
	
	//console.log(`Getting payout coefficient for block ${hash} and combination ${combination}`);

	let coefficient = new BN(0);

	for (let i = 0; i < 6; i++) {
		let before = coefficient;
		let type = '';
		let isNumber = !isNaN(parseInt(lastSymbols[i]));

		if (combination[i] === 255) {
			type = 'undefined';
		}
		else if (combination[i] > 19) {
			type = 'unsupported';
		}

		if (combination[i] === 19) {
			type = 'even';

			if (isNumber)
				if (parseInt(lastSymbols[i]) % 2 === 0)
					coefficient = coefficient.add(new BN('320000000000000000'));
		}

		if (combination[i] === 18) {
			type = 'odd';

			if (isNumber)
				if (parseInt(lastSymbols[i]) % 2 === 1)
					coefficient = coefficient.add(new BN('320000000000000000'));
		}

		if (combination[i] === 17) {
			type = 'any number';

			if (isNumber)
				coefficient = coefficient.add(new BN('160000000000000000'));
		}

		if (combination[i] === 16) {
			type = 'any letter';

			if (!isNumber)
				coefficient = coefficient.add(new BN('266666666666666666'));
		}

		if (combination[i] < 16 && combination[i] > 9) {
			type = 'exact';

			if (combination[i] === 10 && lastSymbols[i].toLowerCase() === 'a')
				coefficient = coefficient.add(new BN('1600000000000000000'));

			if (combination[i] === 11 && lastSymbols[i].toLowerCase() === 'b')
				coefficient = coefficient.add(new BN('1600000000000000000'));

			if (combination[i] === 12 && lastSymbols[i].toLowerCase() === 'c')
				coefficient = coefficient.add(new BN('1600000000000000000'));

			if (combination[i] === 13 && lastSymbols[i].toLowerCase() === 'd')
				coefficient = coefficient.add(new BN('1600000000000000000'));

			if (combination[i] === 14 && lastSymbols[i].toLowerCase() === 'e')
				coefficient = coefficient.add(new BN('1600000000000000000'));

			if (combination[i] === 15 && lastSymbols[i].toLowerCase() === 'f')
				coefficient = coefficient.add(new BN('1600000000000000000'));
		}

		if (combination[i] < 11) {
			type = 'exact';

			if (isNumber)
				if (parseInt(lastSymbols[i]) === combination[i])
					coefficient = coefficient.add(new BN('1600000000000000000'));
		}

		//var checkTypeString = type === 'exact' ? `${lastSymbols[i]} ${combination[i]}` : lastSymbols[i];
		//var result = coefficient === before ? '-' : '+';

		//console.log(`${type}, ${checkTypeString}: ${result}`);
	}

	//console.log(`Coefficient: ${coefficient}`);

	return coefficient;
}

function createBetId() {
	return '0x' + 'xxxxxxxxxxyxxxxxxxxxxxxyxxxxxxxx'.replace(/[xy]/g, function (c) {
		let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}
