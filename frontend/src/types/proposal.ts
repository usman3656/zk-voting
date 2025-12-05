export interface Proposal {
  id: bigint;
  description: string;
  votingType: 0 | 1; // 0 = CANDIDATE_BASED, 1 = ZK_CANDIDATE_BASED
  isFinished: boolean;
  createdAt: bigint;
  finishedAt: bigint;
  // For candidate-based proposals
  candidates?: string[];
  candidateVotes?: { [candidate: string]: bigint };
  winner?: string;
  // User-specific
  canVote?: boolean;
  hasVoted?: boolean;
  totalVotes?: bigint;
  voterChoice?: string; // "Yes", "No", or candidate name
  // Proposal-specific voters
  eligibleVoters?: string[]; // Addresses of voters eligible for this specific proposal
  eligibleVoterCount?: bigint; // Number of eligible voters
  // ZK-specific
  merkleRoot?: string; // Merkle root for ZK proposals
  zkVoteCommitmentsCount?: bigint; // Number of ZK vote commitments
}

