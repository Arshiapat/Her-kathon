// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title WomenSavingsPool
 * @notice A rotating savings pool (ROSCA-style) where members contribute regularly
 *         and receive payouts in rotation. Transparent, trustless, community-built.
 */
contract WomenSavingsPool {
    // ─── State ───────────────────────────────────────────────────────────────

    address public organizer;
    uint256 public contributionAmount;
    uint256 public cycleDuration;      // seconds between each payout
    uint256 public maxMembers;
    uint256 public currentCycle;
    bool public paused;
    bool public poolClosed;

    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => uint256) public contributionsPaid;  // per-member cycle tracking
    mapping(uint256 => bool) public cycleContributed;      // cycle => whether pool received all contributions

    uint256 public totalPoolBalance;

    // ─── Events ──────────────────────────────────────────────────────────────

    event MemberJoined(address indexed member, uint256 totalMembers);
    event ContributionReceived(address indexed member, uint256 amount, uint256 cycle);
    event PayoutSent(address indexed recipient, uint256 amount, uint256 cycle);
    event CycleAdvanced(uint256 newCycle);
    event PoolClosed();
    event PoolPaused(bool paused);
    event EmergencyWithdraw(address indexed organizer, uint256 amount);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error OnlyOrganizer();
    error PoolPausedError();
    error PoolClosedError();
    error PoolFull();
    error AlreadyMember();
    error NotMember();
    error InvalidAmount();
    error InvalidCycleDuration();
    error InvalidMaxMembers();
    error CycleNotComplete();
    error NoFundsToWithdraw();
    error TransferFailed();

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOrganizer() {
        if (msg.sender != organizer) revert OnlyOrganizer();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert PoolPausedError();
        _;
    }

    modifier whenNotClosed() {
        if (poolClosed) revert PoolClosedError();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    /// @param _contributionAmount Amount each member must contribute per cycle (in wei)
    /// @param _cycleDurationSeconds Time between payouts in seconds (e.g., 30 days = 2592000)
    /// @param _maxMembers Maximum number of members allowed in the pool
    constructor(
        uint256 _contributionAmount,
        uint256 _cycleDurationSeconds,
        uint256 _maxMembers
    ) {
        if (_contributionAmount == 0) revert InvalidAmount();
        if (_cycleDurationSeconds == 0) revert InvalidCycleDuration();
        if (_maxMembers == 0) revert InvalidMaxMembers();

        organizer = msg.sender;
        contributionAmount = _contributionAmount;
        cycleDuration = _cycleDurationSeconds;
        maxMembers = _maxMembers;
        currentCycle = 0;
    }

    // ─── External ────────────────────────────────────────────────────────────

    /// @notice Join the pool by paying the first contribution
    function join() external payable whenNotPaused whenNotClosed {
        if (members.length >= maxMembers) revert PoolFull();
        if (isMember[msg.sender]) revert AlreadyMember();
        if (msg.value != contributionAmount) revert InvalidAmount();

        members.push(msg.sender);
        isMember[msg.sender] = true;
        contributionsPaid[msg.sender] = 1;
        totalPoolBalance += msg.value;

        emit MemberJoined(msg.sender, members.length);
    }

    /// @notice Contribute your amount for the current cycle
    function contribute() external payable whenNotPaused whenNotClosed {
        if (!isMember[msg.sender]) revert NotMember();
        if (msg.value != contributionAmount) revert InvalidAmount();

        contributionsPaid[msg.sender] = currentCycle + 1;
        totalPoolBalance += msg.value;

        emit ContributionReceived(msg.sender, msg.value, currentCycle);

        _checkAndProcessCycle();
    }

    /// @notice Process payout for current cycle and advance (callable by anyone when conditions met)
    function processCycle() external whenNotPaused whenNotClosed {
        _checkAndProcessCycle();
    }

    /// @notice Close the pool (organizer only, when all cycles complete)
    function closePool() external onlyOrganizer whenNotClosed {
        require(members.length > 0, "No members");
        uint256 totalCycles = members.length;
        if (currentCycle < totalCycles) revert CycleNotComplete();

        poolClosed = true;
        emit PoolClosed();
    }

    /// @notice Pause or unpause the pool (organizer only)
    function setPaused(bool _paused) external onlyOrganizer {
        paused = _paused;
        emit PoolPaused(_paused);
    }

    /// @notice Emergency withdraw only if pool is closed and has leftover funds (organizer)
    function emergencyWithdraw() external onlyOrganizer {
        if (!poolClosed) revert PoolClosedError();
        if (totalPoolBalance == 0) revert NoFundsToWithdraw();

        uint256 amount = totalPoolBalance;
        totalPoolBalance = 0;

        (bool success, ) = organizer.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit EmergencyWithdraw(organizer, amount);
    }

    // ─── View ────────────────────────────────────────────────────────────────

    /// @notice Get the address who receives the next payout
    function getCurrentRecipient() external view returns (address) {
        if (members.length == 0) return address(0);
        return members[currentCycle % members.length];
    }

    /// @notice Check if all members have contributed for the current cycle
    function isCycleComplete() public view returns (bool) {
        if (members.length == 0) return false;
        for (uint256 i = 0; i < members.length; i++) {
            if (contributionsPaid[members[i]] <= currentCycle) return false;
        }
        return true;
    }

    /// @notice Get total number of members
    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    /// @notice Get all member addresses
    function getMembers() external view returns (address[] memory) {
        return members;
    }

    /// @notice Receive ETH (for flexibility; contributions should use contribute/join)
    receive() external payable {
        revert("Use join() or contribute()");
    }

    fallback() external payable {
        revert("Invalid call");
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _checkAndProcessCycle() internal {
        if (!isCycleComplete()) return;

        uint256 totalCycles = members.length;
        if (currentCycle >= totalCycles) return;

        address recipient = members[currentCycle % totalCycles];
        uint256 payoutAmount = totalPoolBalance;

        totalPoolBalance = 0;
        currentCycle++;

        (bool success, ) = recipient.call{value: payoutAmount}("");
        if (!success) {
            totalPoolBalance = payoutAmount;
            currentCycle--;
            revert TransferFailed();
        }

        emit PayoutSent(recipient, payoutAmount, currentCycle - 1);
        emit CycleAdvanced(currentCycle);
    }
}
