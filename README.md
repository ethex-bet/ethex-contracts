# Ethex Lottery Contracts
```javascript
/**
 * (E)t)h)e)x) Loto Contract 
 *  This smart-contracts are the parts of Ethex Lottery fair game.
 *  See latest version at https://github.com/ethex-bet/ethex-contacts 
 *  http://ethex.bet
 */
```
## Game Rules

Ethex is an Ethereum [smart-contract](https://en.wikipedia.org/wiki/Ethereum#Smart_contracts) lottery game with huge prizes and big chances to win. The rules of the game are very simple and, with a wide range of prize combinations and full transparency through the use of smart-contracts, Ethex is an incredibly exciting game.

Ethex is [provably fair](https://en.wikipedia.org/wiki/Provably_fair) and cryptographically secure. Players are required to guess the hash from the block using their bet transaction. The nature of the Ethereum blockchain makes it impossible to cheat.

## How to play?

The player needs to guess the last hexadecimal numbers of Ethereum block hash, using numbers from 1 to 6. The more symbols the player has matched, the greater their prize.

In each cell, the player can choose from the list one of the following values:

* A specific symbol (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F);
* Any letter group (A, B, C, D, E, F);
* Any number group (0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
* Any even number group (0, 2, 4, 6, 8);
* Any odd number group (1, 3, 5, 7, 9);
* Or leave the cell blank.

After you have selected symbols, you should set your bet amount. The minimum amount is 0.01 ETH for each selected symbol. While you select symbols, the amount is automatically adjusting to the lower bound. You can set greater amount, but not less than 0.01 ETH x \[number of selected symbols\].

Once everything is ready, you should click the "Place a bet" button and confirm your Ethereum transaction which contain your bet. Wait until miners calculate the block containing your transaction and smart-contract. Grab your prize.

Good luck!

## How much can I win?

You win if you guess one or more symbols from the selected symbols group. Note that any symbols group has a higher chance of winning but a smaller prize. On the other hand, a specific symbol has a higher risk of losing but a greater potential prize. If you select only one symbol, your chances of winning and prize rate is as shown in the table below:

Selected symbols group | Win chance | Prize rate
-----------------------|:----------:|:---------:
Any number group (0, 1, 2, 3, 4, 5, 6, 7, 8, 9) | 10 : 16 | x1.6
Any letter group (A, B, C, D, E, F) | 6 : 16 | x2.6
Any even number group (0, 2, 4, 6, 8) | 5 : 16 | x3.2
Any odd number group (1, 3, 5, 7, 9) | 5 : 16 | x3.2
The specific symbol (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F) | 1 : 16 | x16

If you select more symbols but guess less of them your prize rate will be lower than if you guess the exact number of cells, but you get the chance to win the Jackpot.

_Note: the actual prize amount is limited to the current prize pool and is divided proportionally between all winners within the same block, according to their bet amounts._

## Jackpots and Superprize

There are 4 types of guaranteed time-based jackpots in Ethex: Daily Jackpot, Weekly Jackpot, Monthly Jackpot and Season Jackpot plus one chance-based Superprize! When you select more than one cell, your bet is played 4 times for all types of jackpots, even if you didn't guess any symbols from the hash.

Jackpot Type | Amount | Draw Time
-------------|:------:|:--------:
Daily Jackpot | 1/7 of Weekly Jackpot amount | Every 5000 block (roughly once a day)
Weekly Jackpot | 1/4 of Monthly Jackpot amount | Every 35000 block (roughly once a week)
Monthly Jackpot | 1/3 of Season Jackpot amount | Every 150000 block (roughly once a month)
Season Jackpot | 1/4 of total Jackpot amount | Every 450000 block (roughly once every three months)
Superprize | The full Jackpot amount | Immediately after the block with your bet is mined

## How is the winner of jackpot decided?

When you select more than one cell and submit your bet, the smart-contract registers it for the jackpot draw. Its registration number is displayed on result screen as an index number of your bet within all bets registered to play for the jackpot. The process of deciding the winner of jackpot is very simple and straightforward.

When the block of jackpot of a specific type is mined (i.e. next 35000-th block for the Weekly Jackpot), smart-contract uses its hexadecimal hash to convert it into the number and starts to count every bet registered for the jackpot. If there are less bets than the hash number, it continues to count from the first bet again and again, and so on until the hash number ends. The last bet before the count ends is the winner of the jackpot.

> If the count stops on one of your bets, congratulation – you win the jackpot!

To win the Superprize, you need to select the specific symbol for all 6 cells. If you guess all of the last 6 symbols of the next Ethereum block, you immediately win the whole prize pool and the full jackpot amount!

> If you manage to guess all 6 symbol of the hash – you win the Superprize!

_Note: if there is more than one person who guesses all 6 cells, the whole jackpot amount is divided proportionally between all winners, according to their bet amounts._
