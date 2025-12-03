export interface Proposal {
  id: bigint;
  description: string;
  votingType: 0 | 1; // 0 = CANDIDATE_BASED, 1 = YES_NO
  isFinished: boolean;
  createdAt: bigint;
  finishedAt: bigint;
  // For candidate-based proposals
  candidates?: string[];
  candidateVotes?: { [candidate: string]: bigint };
  winner?: string;
  // For yes/no proposals
  yesCount?: bigint;
  noCount?: bigint;
  // User-specific
  canVote?: boolean;
  hasVoted?: boolean;
  totalVotes?: bigint;
  voterChoice?: string; // "Yes", "No", or candidate name
  // Proposal-specific voters
  eligibleVoters?: string[]; // Addresses of voters eligible for this specific proposal
  eligibleVoterCount?: bigint; // Number of eligible voters
}

