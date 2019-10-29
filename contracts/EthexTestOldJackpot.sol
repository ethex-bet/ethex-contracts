pragma solidity 0.5.10;

/**
 * (E)t)h)e)x) Jackpot Contract 
 *  This smart-contract is the part of Ethex Lottery fair game.
 *  See latest version at https://github.com/ethex-bet/ethex-contracts 
 *  http://ethex.bet
 */
 
contract EthexTestOldJackpot {
    mapping(uint256 => address payable) public tickets;
    mapping(uint256 => Segment[4]) public prevJackpots;
    uint256[4] public amounts;
    uint256[4] public starts;
    uint256[4] public ends;
    uint256[4] public numberStarts;
    uint256 public numberEnd;
    uint256 public firstNumber;
    uint256 public dailyAmount;
    uint256 public weeklyAmount;
    uint256 public monthlyAmount;
    uint256 public seasonalAmount;
    bool public dailyProcessed;
    bool public weeklyProcessed;
    bool public monthlyProcessed;
    bool public seasonalProcessed;
    address public lotoAddress;
    address payable public newVersionAddress;
    
    uint256 public dailyNumberStartPrev;
    uint256 public weeklyNumberStartPrev;
    uint256 public monthlyNumberStartPrev;
    uint256 public seasonalNumberStartPrev;
    uint256 public dailyStart;
    uint256 public weeklyStart;
    uint256 public monthlyStart;
    uint256 public seasonalStart;
    uint256 public dailyEnd;
    uint256 public weeklyEnd;
    uint256 public monthlyEnd;
    uint256 public seasonalEnd;
    uint256 public dailyNumberStart;
    uint256 public weeklyNumberStart;
    uint256 public monthlyNumberStart;
    uint256 public seasonalNumberStart;
    uint256 public dailyNumberEndPrev;
    uint256 public weeklyNumberEndPrev;
    uint256 public monthlyNumberEndPrev;
    uint256 public seasonalNumberEndPrev;
    
    struct Segment {
        uint256 start;
        uint256 end;
        bool processed;
    }
    
    event Jackpot (
        uint256 number,
        uint256 count,
        uint256 amount,
        byte jackpotType
    );
    
    event Ticket (
        uint256 number
    );
    
    event Superprize (
        uint256 amount,
        address winner
    );

    function setupUnprocessed(uint256 previousJackpotBlockNumber) public {
        numberEnd = 1;

        dailyNumberStartPrev = 1;
        weeklyNumberStartPrev = 1;
        monthlyNumberStartPrev = 1;
        seasonalNumberStartPrev = 1;
        dailyProcessed = true;
        weeklyProcessed = true;
        monthlyProcessed = true;
        seasonalProcessed = true;
        dailyStart = previousJackpotBlockNumber;
        weeklyStart  = previousJackpotBlockNumber;
        monthlyStart  = previousJackpotBlockNumber;
        seasonalStart  = previousJackpotBlockNumber;
        dailyEnd = previousJackpotBlockNumber + 5000;
        weeklyEnd = previousJackpotBlockNumber + 35000;
        monthlyEnd = previousJackpotBlockNumber + 150000;
        seasonalEnd = previousJackpotBlockNumber + 450000;
        dailyNumberStart = 1;
        weeklyNumberStart = 1;
        monthlyNumberStart = 1;
        seasonalNumberStart = 1;
        dailyNumberEndPrev = 1;
        weeklyNumberEndPrev = 1;
        monthlyNumberEndPrev = 1;
        seasonalNumberEndPrev = 1;
    }

    function migrate() external { }
}
