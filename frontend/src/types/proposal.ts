export interface Proposal {
  id: bigint;
  description: string;
  votingType: 0; // 0 = CANDIDATE_BASED (only candidate-based voting is supported)
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
}

