// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./ZKVotingVerifier.sol";

/**
 * @title SimpleVoting
 * @dev An advanced voting system contract that supports:
 * - Proposal-specific voter bases (each proposal can have different eligible voters)
 * - Candidate-based voting (multiple choices)
 * - Owner can finish voting and show results
 * - University-style voting with multiple candidates
 * - ZK anonymous voting
 */
contract SimpleVoting {
    // State variables
    address public owner;
    
    // Voting type enum
    enum VotingType {
        CANDIDATE_BASED,  // Multiple candidates, choose one
        ZK_CANDIDATE_BASED  // ZK anonymous candidate-based voting
    }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        string description;
        VotingType votingType;
        bool isFinished;
        bool exists;
        uint256 createdAt;
        uint256 finishedAt;
    }
    
    // Mapping of proposal ID to Proposal
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    // Mapping of proposal ID to array of candidate names
    mapping(uint256 => string[]) public proposalCandidates;
    
    // Mapping of proposal ID to candidate name to vote count
    mapping(uint256 => mapping(string => uint256)) public candidateVotes;
    
    // Mapping of proposal ID to array of eligible voter addresses
    mapping(uint256 => address[]) public proposalVoters;
    
    // Mapping of proposal ID to mapping of voter address to permission
    mapping(uint256 => mapping(address => bool)) public canVoteOnProposal;
    
    // Track who has voted for which proposal
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    // Track which candidate each voter chose (for candidate-based)
    mapping(uint256 => mapping(address => string)) public voterChoice;
    
    // ZK Voting state variables
    // Merkle root for voter eligibility (ZK proposals only)
    mapping(uint256 => bytes32) public proposalMerkleRoots;
    
    // Track used nullifiers (prevents double-voting in ZK)
    mapping(uint256 => mapping(bytes32 => bool)) public usedNullifiers;
    
    // Vote commitments for ZK proposals (Option B: commitments only)
    struct ZKVoteCommitment {
        bytes32 commitment;  // hash(vote + secret)
        uint256 timestamp;
    }
    mapping(uint256 => ZKVoteCommitment[]) public zkVoteCommitments;
    
    // ZK Verifier contract (imported from generated verifier)
    Groth16Verifier public zkVerifier;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string description,
        VotingType votingType
    );
    event VoterAddedToProposal(
        uint256 indexed proposalId,
        address indexed voter
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        string choice
    );
    event ZKVoteCast(
        uint256 indexed proposalId,
        bytes32 nullifier,
        bytes32 commitment
    );
    event VotingFinished(
        uint256 indexed proposalId,
        string winner
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier validProposal(uint256 _proposalId) {
        require(proposals[_proposalId].exists, "Proposal does not exist");
        _;
    }
    
    modifier canVote(uint256 _proposalId) {
        require(canVoteOnProposal[_proposalId][msg.sender], "You are not eligible to vote on this proposal");
        require(!hasVoted[_proposalId][msg.sender], "You have already voted for this proposal");
        require(!proposals[_proposalId].isFinished, "Voting for this proposal has ended");
        _;
    }
    
    constructor(address _zkVerifier) {
        owner = msg.sender;
        proposalCount = 0;
        if (_zkVerifier != address(0)) {
            zkVerifier = Groth16Verifier(_zkVerifier);
        }
    }
    
    /**
     * @dev Set ZK verifier (owner only, for upgrading)
     */
    function setZKVerifier(address _zkVerifier) public onlyOwner {
        zkVerifier = Groth16Verifier(_zkVerifier);
    }
    
    /**
     * @dev Create a new proposal with candidate-based voting (like university elections)
     * @param _description Description of the proposal
     * @param _candidates Array of candidate names
     * @return proposalId The ID of the newly created proposal
     */
    function createCandidateProposal(
        string memory _description,
        string[] memory _candidates
    ) public onlyOwner returns (uint256) {
        require(_candidates.length > 0, "Must have at least one candidate");
        require(_candidates.length <= 50, "Maximum 50 candidates allowed");
        
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: _description,
            votingType: VotingType.CANDIDATE_BASED,
            isFinished: false,
            exists: true,
            createdAt: block.timestamp,
            finishedAt: 0
        });
        
        proposalCandidates[proposalCount] = _candidates;
        
        emit ProposalCreated(proposalCount, _description, VotingType.CANDIDATE_BASED);
        return proposalCount;
    }
    
    /**
     * @dev Create a new ZK proposal with candidate-based voting (anonymous)
     * @param _description Description of the proposal
     * @param _candidates Array of candidate names
     * @param _merkleRoot Merkle root of eligible voters
     * @return proposalId The ID of the newly created proposal
     */
    function createZKProposal(
        string memory _description,
        string[] memory _candidates,
        bytes32 _merkleRoot
    ) public onlyOwner returns (uint256) {
        require(_candidates.length > 0, "Must have at least one candidate");
        require(_candidates.length <= 50, "Maximum 50 candidates allowed");
        require(_merkleRoot != bytes32(0), "Merkle root cannot be zero");
        
        proposalCount++;
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            description: _description,
            votingType: VotingType.ZK_CANDIDATE_BASED,
            isFinished: false,
            exists: true,
            createdAt: block.timestamp,
            finishedAt: 0
        });
        
        proposalCandidates[proposalCount] = _candidates;
        proposalMerkleRoots[proposalCount] = _merkleRoot;
        
        emit ProposalCreated(proposalCount, _description, VotingType.ZK_CANDIDATE_BASED);
        return proposalCount;
    }
    
    /**
     * @dev Add a voter to a specific proposal (owner can give permission to vote on specific proposal)
     * @param _proposalId ID of the proposal
     * @param _voter Address of the voter to add
     */
    function addVoterToProposal(
        uint256 _proposalId,
        address _voter
    ) public onlyOwner validProposal(_proposalId) {
        require(_voter != address(0), "Invalid address");
        require(!canVoteOnProposal[_proposalId][_voter], "Voter already added to this proposal");
        
        canVoteOnProposal[_proposalId][_voter] = true;
        proposalVoters[_proposalId].push(_voter);
        
        emit VoterAddedToProposal(_proposalId, _voter);
    }
    
    /**
     * @dev Add multiple voters to a specific proposal
     * @param _proposalId ID of the proposal
     * @param _voters Array of voter addresses
     */
    function addVotersToProposal(
        uint256 _proposalId,
        address[] memory _voters
    ) public onlyOwner validProposal(_proposalId) {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] != address(0) && !canVoteOnProposal[_proposalId][_voters[i]]) {
                canVoteOnProposal[_proposalId][_voters[i]] = true;
                proposalVoters[_proposalId].push(_voters[i]);
                emit VoterAddedToProposal(_proposalId, _voters[i]);
            }
        }
    }
    
    /**
     * @dev Vote for a candidate in candidate-based voting
     * @param _proposalId ID of the proposal
     * @param _candidateName Name of the candidate to vote for
     */
    function voteForCandidate(
        uint256 _proposalId,
        string memory _candidateName
    ) public validProposal(_proposalId) canVote(_proposalId) {
        require(
            proposals[_proposalId].votingType == VotingType.CANDIDATE_BASED,
            "This proposal is not candidate-based"
        );
        
        // Check if candidate exists
        string[] memory candidates = proposalCandidates[_proposalId];
        bool candidateExists = false;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (keccak256(bytes(candidates[i])) == keccak256(bytes(_candidateName))) {
                candidateExists = true;
                break;
            }
        }
        require(candidateExists, "Candidate does not exist");
        
        hasVoted[_proposalId][msg.sender] = true;
        candidateVotes[_proposalId][_candidateName]++;
        voterChoice[_proposalId][msg.sender] = _candidateName;
        
        emit VoteCast(msg.sender, _proposalId, _candidateName);
    }
    
    /**
     * @dev Vote using ZK proof (anonymous voting)
     * @param _proposalId ID of the proposal
     * @param _proof ZK-SNARK proof (8 uint256 values: [a0, a1, b00, b01, b10, b11, c0, c1])
     * @param _publicInputs Public inputs [proposalId, merkleRoot, nullifier, numCandidates]
     * @param _commitment Vote commitment hash(vote + secret)
     */
    function voteWithZK(
        uint256 _proposalId,
        uint256[8] calldata _proof,
        uint256[4] calldata _publicInputs,
        bytes32 _commitment
    ) public validProposal(_proposalId) {
        require(
            proposals[_proposalId].votingType == VotingType.ZK_CANDIDATE_BASED,
            "This proposal is not ZK voting"
        );
        require(!proposals[_proposalId].isFinished, "Voting for this proposal has ended");
        require(address(zkVerifier) != address(0), "ZK verifier not set");
        
        // Extract public inputs
        uint256 proposalId = _publicInputs[0];
        bytes32 merkleRoot = bytes32(_publicInputs[1]);
        bytes32 nullifier = bytes32(_publicInputs[2]);
        uint256 numCandidates = _publicInputs[3];
        
        // Verify proposal ID matches
        require(proposalId == _proposalId, "Proposal ID mismatch");
        
        // Verify Merkle root matches
        require(merkleRoot == proposalMerkleRoots[_proposalId], "Merkle root mismatch");
        
        // Verify number of candidates
        require(numCandidates == proposalCandidates[_proposalId].length, "Candidate count mismatch");
        
        // Verify nullifier hasn't been used
        require(!usedNullifiers[_proposalId][nullifier], "Nullifier already used");
        
        // Verify ZK proof (no public signals since circuit has 0 public inputs)
        // We verify proposalId, merkleRoot, nullifier, and numCandidates separately above
        uint256[2] memory a = [_proof[0], _proof[1]];
        uint256[2][2] memory b = [[_proof[2], _proof[3]], [_proof[4], _proof[5]]];
        uint256[2] memory c = [_proof[6], _proof[7]];
        
        require(zkVerifier.verifyProof(a, b, c), "Invalid ZK proof");
        
        // Mark nullifier as used
        usedNullifiers[_proposalId][nullifier] = true;
        
        // Store vote commitment
        zkVoteCommitments[_proposalId].push(ZKVoteCommitment({
            commitment: _commitment,
            timestamp: block.timestamp
        }));
        
        emit ZKVoteCast(_proposalId, nullifier, _commitment);
    }
    
    /**
     * @dev Finish voting for a proposal (only owner can do this)
     * @param _proposalId ID of the proposal
     */
    function finishVoting(uint256 _proposalId) public onlyOwner validProposal(_proposalId) {
        require(!proposals[_proposalId].isFinished, "Voting already finished");
        
        proposals[_proposalId].isFinished = true;
        proposals[_proposalId].finishedAt = block.timestamp;
        
        string memory winner;
        
        if (proposals[_proposalId].votingType == VotingType.ZK_CANDIDATE_BASED) {
            // For ZK voting, owner needs to reveal commitments and tally
            // This will be done off-chain or in a separate function
            // For now, return placeholder
            winner = "Pending Tally"; // Owner will call revealZKVotes separately
        } else {
            // Check for ties in candidate-based voting
            string[] memory candidates = proposalCandidates[_proposalId];
            require(candidates.length > 0, "No candidates");
            
            uint256 maxVotes = candidateVotes[_proposalId][candidates[0]];
            uint256 candidatesWithMaxVotes = 1;
            
            // Find max votes and count how many candidates have that many votes
            for (uint256 i = 1; i < candidates.length; i++) {
                uint256 votes = candidateVotes[_proposalId][candidates[i]];
                if (votes > maxVotes) {
                    maxVotes = votes;
                    candidatesWithMaxVotes = 1;
                } else if (votes == maxVotes && votes > 0) {
                    candidatesWithMaxVotes++;
                }
            }
            
            // If multiple candidates have max votes, it's a tie
            if (candidatesWithMaxVotes > 1 && maxVotes > 0) {
                winner = "Tie";
            } else {
                winner = getWinnerCandidate(_proposalId);
            }
        }
        
        emit VotingFinished(_proposalId, winner);
    }
    
    /**
     * @dev Reveal and tally ZK votes (owner only, after voting ends)
     * @param _proposalId ID of the proposal
     * @param _candidateIndices Array of candidate indices for each vote
     * @param _secrets Array of secrets for each vote commitment
     */
    function revealZKVotes(
        uint256 _proposalId,
        uint256[] memory _candidateIndices,
        bytes32[] memory _secrets
    ) public onlyOwner validProposal(_proposalId) {
        require(proposals[_proposalId].isFinished, "Voting must be finished first");
        require(
            proposals[_proposalId].votingType == VotingType.ZK_CANDIDATE_BASED,
            "Not a ZK proposal"
        );
        
        ZKVoteCommitment[] memory commitments = zkVoteCommitments[_proposalId];
        require(
            _candidateIndices.length == commitments.length &&
            _secrets.length == commitments.length,
            "Reveal data length mismatch"
        );
        
        string[] memory candidates = proposalCandidates[_proposalId];
        
        // Verify and count votes
        for (uint256 i = 0; i < commitments.length; i++) {
            // Verify commitment matches reveal
            bytes32 computedCommitment = keccak256(abi.encodePacked(_candidateIndices[i], _secrets[i]));
            require(computedCommitment == commitments[i].commitment, "Invalid commitment");
            
            // Verify candidate index is valid
            require(_candidateIndices[i] < candidates.length, "Invalid candidate index");
            
            // Count the vote
            candidateVotes[_proposalId][candidates[_candidateIndices[i]]]++;
        }
        
        // Determine winner
        string memory winner = getWinnerCandidate(_proposalId);
        
        // Update finished event with actual winner
        emit VotingFinished(_proposalId, winner);
    }
    
    /**
     * @dev Get the winner candidate for a proposal (highest votes wins)
     * @param _proposalId ID of the proposal
     * @return winnerName Name of the winning candidate
     */
    function getWinnerCandidate(uint256 _proposalId) public view validProposal(_proposalId) returns (string memory) {
        require(
            proposals[_proposalId].votingType == VotingType.CANDIDATE_BASED,
            "Not a candidate-based proposal"
        );
        
        string[] memory candidates = proposalCandidates[_proposalId];
        require(candidates.length > 0, "No candidates");
        
        string memory winner = candidates[0];
        uint256 maxVotes = candidateVotes[_proposalId][candidates[0]];
        
        for (uint256 i = 1; i < candidates.length; i++) {
            uint256 votes = candidateVotes[_proposalId][candidates[i]];
            if (votes > maxVotes) {
                maxVotes = votes;
                winner = candidates[i];
            }
        }
        
        return winner;
    }
    
    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 _proposalId) public view validProposal(_proposalId)
        returns (
            uint256 id,
            string memory description,
            VotingType votingType,
            bool isFinished,
            uint256 createdAt,
            uint256 finishedAt
        ) {
        Proposal memory proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.description,
            proposal.votingType,
            proposal.isFinished,
            proposal.createdAt,
            proposal.finishedAt
        );
    }
    
    /**
     * @dev Get candidates for a proposal
     */
    function getProposalCandidates(uint256 _proposalId) public view validProposal(_proposalId)
        returns (string[] memory) {
        return proposalCandidates[_proposalId];
    }
    
    /**
     * @dev Get Merkle root for a ZK proposal
     */
    function getProposalMerkleRoot(uint256 _proposalId) public view validProposal(_proposalId)
        returns (bytes32) {
        return proposalMerkleRoots[_proposalId];
    }
    
    /**
     * @dev Get ZK vote commitments count for a proposal
     */
    function getZKVoteCommitmentsCount(uint256 _proposalId) public view validProposal(_proposalId)
        returns (uint256) {
        return zkVoteCommitments[_proposalId].length;
    }
    
    /**
     * @dev Check if nullifier has been used
     */
    function isNullifierUsed(uint256 _proposalId, bytes32 _nullifier) public view
        returns (bool) {
        return usedNullifiers[_proposalId][_nullifier];
    }
    
    /**
     * @dev Get vote count for a specific candidate
     */
    function getCandidateVoteCount(uint256 _proposalId, string memory _candidateName)
        public view validProposal(_proposalId) returns (uint256) {
        return candidateVotes[_proposalId][_candidateName];
    }
    
    /**
     * @dev Get all voters for a proposal
     */
    function getProposalVoters(uint256 _proposalId) public view validProposal(_proposalId)
        returns (address[] memory) {
        return proposalVoters[_proposalId];
    }
    
    /**
     * @dev Check if a voter can vote on a proposal
     */
    function canVoteOnProposalCheck(uint256 _proposalId, address _voter)
        public view validProposal(_proposalId) returns (bool) {
        return canVoteOnProposal[_proposalId][_voter];
    }
    
    /**
     * @dev Check if a voter has voted on a proposal
     */
    function checkVoteStatus(uint256 _proposalId, address _voter)
        public view validProposal(_proposalId) returns (bool) {
        return hasVoted[_proposalId][_voter];
    }
    
    /**
     * @dev Get voter's choice for a proposal
     */
    function getVoterChoice(uint256 _proposalId, address _voter)
        public view validProposal(_proposalId) returns (string memory) {
        require(hasVoted[_proposalId][_voter], "Voter has not voted");
            return voterChoice[_proposalId][_voter];
    }
    
    /**
     * @dev Get total vote count for a proposal
     */
    function getTotalVoteCount(uint256 _proposalId) public view validProposal(_proposalId)
        returns (uint256) {
            uint256 total = 0;
            string[] memory candidates = proposalCandidates[_proposalId];
            for (uint256 i = 0; i < candidates.length; i++) {
                total += candidateVotes[_proposalId][candidates[i]];
            }
            return total;
    }
    
    // Legacy functions for backward compatibility (deprecated)
    
    /**
     * @dev DEPRECATED: Use createCandidateProposal instead
     * @notice This function is kept for backward compatibility but is no longer supported
     */
    function createProposal(string memory _description) public onlyOwner returns (uint256) {
        revert("createProposal is deprecated. Use createCandidateProposal with at least one candidate.");
    }
    
    /**
     * @dev DEPRECATED: Use voteForCandidate instead
     * @notice This function is kept for backward compatibility but is no longer supported
     */
    function vote(uint256 _proposalId) public validProposal(_proposalId) {
        revert("vote is deprecated. Use voteForCandidate with a candidate name.");
    }
    
    /**
     * @dev DEPRECATED: Use getTotalVoteCount instead
     */
    function getVoteCount(uint256 _proposalId) public view validProposal(_proposalId) returns (uint256) {
        return getTotalVoteCount(_proposalId);
    }
    
    /**
     * @dev DEPRECATED: Legacy voter registration - kept for backward compatibility
     * @notice New system uses addVoterToProposal for proposal-specific voters
     */
    mapping(address => bool) public isRegisteredVoter;
    address[] public registeredVoters;
    
    function registerVoter(address _voter) public onlyOwner {
        require(_voter != address(0), "Invalid address");
        require(!isRegisteredVoter[_voter], "Voter already registered");
        
        isRegisteredVoter[_voter] = true;
        registeredVoters.push(_voter);
    }
    
    function registerVoters(address[] memory _voters) public onlyOwner {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (_voters[i] != address(0) && !isRegisteredVoter[_voters[i]]) {
                isRegisteredVoter[_voters[i]] = true;
                registeredVoters.push(_voters[i]);
            }
        }
    }
    
    function getVoterCount() public view returns (uint256) {
        return registeredVoters.length;
    }
}
