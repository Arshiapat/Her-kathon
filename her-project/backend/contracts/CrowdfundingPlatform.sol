// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CrowdfundingPlatform
 * @notice Kickstarter-like platform where users can invest in business campaigns.
 *         Campaigns have funding goals; creators can withdraw when goal is met.
 */
contract CrowdfundingPlatform {
    struct Campaign {
        address creator;
        uint256 goal;
        uint256 raised;
        uint256 deadline;
        bool funded;
        bool withdrawn;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public backerAmounts;
    uint256 public campaignCount;

    event CampaignCreated(uint256 indexed campaignId, address creator, uint256 goal, uint256 deadline);
    event Invested(uint256 indexed campaignId, address backer, uint256 amount);
    event FundsWithdrawn(uint256 indexed campaignId, address creator, uint256 amount);

    error CampaignNotFound();
    error CampaignEnded();
    error CampaignAlreadyFunded();
    error InvalidAmount();
    error GoalNotReached();
    error AlreadyWithdrawn();
    error NotCreator();
    error TransferFailed();

    /// @notice Create a new campaign
    function createCampaign(uint256 _goalWei, uint256 _durationSeconds) external returns (uint256) {
        if (_goalWei == 0) revert InvalidAmount();
        uint256 deadline = block.timestamp + _durationSeconds;
        uint256 id = campaignCount++;
        campaigns[id] = Campaign({
            creator: msg.sender,
            goal: _goalWei,
            raised: 0,
            deadline: deadline,
            funded: false,
            withdrawn: false
        });
        emit CampaignCreated(id, msg.sender, _goalWei, deadline);
        return id;
    }

    /// @notice Invest in a campaign with ETH
    function invest(uint256 _campaignId) external payable {
        Campaign storage c = campaigns[_campaignId];
        if (c.creator == address(0)) revert CampaignNotFound();
        if (block.timestamp > c.deadline) revert CampaignEnded();
        if (c.funded) revert CampaignAlreadyFunded();
        if (msg.value == 0) revert InvalidAmount();

        c.raised += msg.value;
        backerAmounts[_campaignId][msg.sender] += msg.value;

        if (c.raised >= c.goal) {
            c.funded = true;
        }

        emit Invested(_campaignId, msg.sender, msg.value);
    }

    /// @notice Creator withdraws funds when goal is reached
    function withdraw(uint256 _campaignId) external {
        Campaign storage c = campaigns[_campaignId];
        if (msg.sender != c.creator) revert NotCreator();
        if (!c.funded) revert GoalNotReached();
        if (c.withdrawn) revert AlreadyWithdrawn();

        c.withdrawn = true;
        uint256 amount = c.raised;

        (bool success, ) = c.creator.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FundsWithdrawn(_campaignId, c.creator, amount);
    }

    /// @notice Get campaign details
    function getCampaign(uint256 _campaignId) external view returns (
        address creator,
        uint256 goal,
        uint256 raised,
        uint256 deadline,
        bool funded,
        bool withdrawn
    ) {
        Campaign memory c = campaigns[_campaignId];
        if (c.creator == address(0)) revert CampaignNotFound();
        return (c.creator, c.goal, c.raised, c.deadline, c.funded, c.withdrawn);
    }

    /// @notice Get amount a backer has invested in a campaign
    function getBackerAmount(uint256 _campaignId, address _backer) external view returns (uint256) {
        return backerAmounts[_campaignId][_backer];
    }

    receive() external payable {
        revert("Use invest(campaignId)");
    }
}
