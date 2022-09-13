//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20.sol";

/// @title staking contract for ERC20
contract Staking is Ownable {
    struct Stake {
        address wallet;
        uint24 amount;
        uint32 startTimestamp;
        uint32 endTimestamp;
    }

    bool private _isActive;

    IERC20 private _token;

    Stake[] private _stakes;

    mapping(address => uint256) private _addressToStake;

    event Staked(address wallet, uint24 amount, uint32 startTimestamp);
    event Unstaked(address wallet, uint32 endTimestamp);

    error AlreadyStaked();
    error IncorrectAmount();
    error NotStaked();
    error StakingNotActive();

    /// @param token ERC20 to staking on the contract
    constructor(IERC20 token) {
        _token = token;
    }

    /// @notice stake tokens
    /// @dev the indexes pointed to by the addresses start from one, 
    ///      so that you can easily check if this wallet already exists (address => 0),
    ///      that's why stake = _stakes[_addressToStake[address] - 1]
    /// @param amount of tokens
    function stake(uint24 amount) external {
        if (_isActive == false) {
            revert StakingNotActive();
        }

        if (amount < 10 || amount > 1_000_000) {
            revert IncorrectAmount();
        }

        if (_addressToStake[msg.sender] == 0) {
            _token.transferFrom(msg.sender, address(this), amount);

            _stakes.push(Stake({
                wallet: msg.sender,
                amount: amount,
                startTimestamp: uint32(block.timestamp),
                endTimestamp: 0
            }));
            _addressToStake[msg.sender] = _stakes.length;
        } else {
            _token.transferFrom(msg.sender, address(this), amount);

            Stake storage stake_ = _stakes[_addressToStake[msg.sender] - 1];

            if (stake_.amount != 0) {
                revert AlreadyStaked();
            }

            stake_.amount = amount;
            stake_.startTimestamp = uint32(block.timestamp);
            stake_.endTimestamp = 0;
        }

        emit Staked(msg.sender, amount, uint32(block.timestamp));
    }

    /// @notice unstake all tokens
    function unstake() external {
        if (_addressToStake[msg.sender] == 0 || _stakes[_addressToStake[msg.sender] - 1].amount == 0) {
            revert NotStaked();
        }

        Stake storage stake_ = _stakes[_addressToStake[msg.sender] - 1];
        
        uint24 amount = stake_.amount;

        stake_.amount = 0;
        stake_.endTimestamp = uint32(block.timestamp);

        _token.transfer(msg.sender, amount);

        emit Unstaked(msg.sender, stake_.endTimestamp);
    }

    /// @notice set isActive flag
    /// @param isActive_ true - staking is active
    function setIsActive(bool isActive_) external onlyOwner {
        _isActive = isActive_;
    }

    /// @notice returns all stakes
    /// @return _stakes
    function stakes() external view returns(Stake[] memory) {
        return _stakes;
    }

    /// @notice returns isActive flag
    /// @return _isActive
    function isActive() external view returns(bool) {
        return _isActive;
    }
}
