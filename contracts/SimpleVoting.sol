// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SimpleVoting
 * @dev A simple voting system contract that allows:
 * - Owner to register voters and create proposals
 * - Registered voters to cast votes
 * - Anyone to view results
 */
contract SimpleVoting {
    // State variables
    address public owner;
    
    // Voter registration
    mapping(address => bool) public isRegisteredVoter;
    address[] public registeredVoters;
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        string description;
        uint256 voteCount;
        bool exists;
    }
    
    // Mapping of proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // Track who has voted for which proposal
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Events
    event VoterRegistered(address indexed voter);
    event ProposalCreated(uint256 indexed proposalId, string description);
    event VoteCast(address indexed voter, uint256 indexed proposalId);
    event VotingEnded(uint256 indexed proposalId, uint256 voteCount);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(isRegisteredVoter[msg.sender], "You are not a registered voter");
        _;
    }
    
    modifier validProposal(uint256 _proposalId) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        proposalCount = 0;
    }
    
    /**
     * @dev Register a new voter (only owner can do this)
     * @param _voter Address of the voter to register
     */
    function registerVoter(address _voter) public onlyOwner {
        require(_voter != address(0), "Invalid address");
        require(!isRegisteredVoter[_voter], "Voter already registered");
        
        isRegisteredVoter[_voter] = true;
        registeredVoters.push(_voter);
        
        emit VoterRegistered(_voter);
    }
    
    /**
     * @dev Register multiple voters at once
     * @param _voters Array of voter addresses
     */
    function registerVoters(address[] memory _voters) public onlyOwner {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] != address(0) && !isRegisteredVoter[_voters[i]]) {
                isRegisteredVoter[_voters[i]] = true;
                registeredVoters.push(_voters[i]);
                emit VoterRegistered(_voters[i]);
            }
        }
    }
    
    /**
     * @dev Create a new proposal (only owner can do this)
     * @param _description Description of the proposal
     * @return proposalId The ID of the newly created proposal
     */
    function createProposal(string memory _description) public onlyOwner returns (uint256) {
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: _description,
            voteCount: 0,
            exists: true
        });
        
        emit ProposalCreated(proposalCount, _description);
        return proposalCount;
    }
    
    /**
     * @dev Cast a vote for a proposal
     * @param _proposalId ID of the proposal to vote for
     */
    function vote(uint256 _proposalId) public onlyRegisteredVoter validProposal(_proposalId) {
        require(!hasVoted[_proposalId][msg.sender], "You have already voted for this proposal");
        
        hasVoted[_proposalId][msg.sender] = true;
        proposals[_proposalId].voteCount++;
        
        emit VoteCast(msg.sender, _proposalId);
    }
    
    /**
     * @dev Get the vote count for a proposal
     * @param _proposalId ID of the proposal
     * @return voteCount Number of votes for the proposal
     */
    function getVoteCount(uint256 _proposalId) public view validProposal(_proposalId) returns (uint256) {
        return proposals[_proposalId].voteCount;
    }
    
    /**
     * @dev Get proposal details
     * @param _proposalId ID of the proposal
     * @return id Proposal ID
     * @return description Proposal description
     * @return voteCount Number of votes
     */
    function getProposal(uint256 _proposalId) public view validProposal(_proposalId) 
        returns (uint256 id, string memory description, uint256 voteCount) {
        Proposal memory proposal = proposals[_proposalId];
        return (proposal.id, proposal.description, proposal.voteCount);
    }
    
    /**
     * @dev Get total number of registered voters
     * @return count Number of registered voters
     */
    function getVoterCount() public view returns (uint256) {
        return registeredVoters.length;
    }
    
    /**
     * @dev Check if an address has voted for a specific proposal
     * @param _proposalId ID of the proposal
     * @param _voter Address of the voter
     * @return true if the voter has voted, false otherwise
     */
    function checkVoteStatus(uint256 _proposalId, address _voter) public view returns (bool) {
        return hasVoted[_proposalId][_voter];
    }
}

