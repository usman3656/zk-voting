import type { Proposal } from '../types/proposal';
import { VotingType } from '../config/contract';
import { CandidateVoting } from './CandidateVoting';
import { YesNoVoting } from './YesNoVoting';
import { ResultsDisplay } from './ResultsDisplay';
import { FinishVotingButton } from './FinishVotingButton';
import { ProposalVoterManager } from './ProposalVoterManager';

interface ProposalCardProps {
  proposal: Proposal;
  onVoteForCandidate: (candidateName: string) => Promise<void>;
  onVoteYesNo: (isYes: boolean) => Promise<void>;
  onFinishVoting: () => Promise<void>;
  onAddVoter: (voterAddress: string) => Promise<void>;
  onAddVoters: (voterAddresses: string[]) => Promise<void>;
  isOwner: boolean;
  isLoading?: boolean;
}

export function ProposalCard({
  proposal,
  onVoteForCandidate,
  onVoteYesNo,
  onFinishVoting,
  onAddVoter,
  onAddVoters,
  isOwner,
  isLoading = false,
}: ProposalCardProps) {
  const votingTypeLabel = proposal.votingType === VotingType.CANDIDATE_BASED ? 'Candidate-Based' : 'Yes/No';
  const statusBadge = proposal.isFinished ? 'Finished' : 'Active';

  return (
    <div style={{
      border: `2px solid ${proposal.isFinished ? '#9e9e9e' : proposal.votingType === VotingType.CANDIDATE_BASED ? '#4CAF50' : '#2196F3'}`,
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.3s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#2196F3', fontSize: '20px', marginBottom: '5px' }}>
            Proposal #{proposal.id.toString()}
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '4px 10px',
              backgroundColor: proposal.votingType === VotingType.CANDIDATE_BASED ? '#e8f5e9' : '#e3f2fd',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: proposal.votingType === VotingType.CANDIDATE_BASED ? '#2e7d32' : '#1976D2'
            }}>
              {votingTypeLabel}
            </span>
            <span style={{
              padding: '4px 10px',
              backgroundColor: proposal.isFinished ? '#f5f5f5' : '#fff3e0',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: proposal.isFinished ? '#666' : '#E65100'
            }}>
              {statusBadge}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 12px',
            backgroundColor: '#e3f2fd',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1976D2'
          }}>
            {proposal.totalVotes?.toString() || '0'} {proposal.totalVotes === 1n ? 'vote' : 'votes'}
          </div>
          {proposal.eligibleVoterCount !== undefined && (
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#fff3e0',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#E65100'
            }}>
              👥 {proposal.eligibleVoterCount.toString()} {proposal.eligibleVoterCount === 1n ? 'voter' : 'voters'}
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '15px',
        lineHeight: '1.6',
        color: '#333'
      }}>
        {proposal.description}
      </div>

      {/* Show candidates for candidate-based proposals */}
      {proposal.votingType === VotingType.CANDIDATE_BASED && proposal.candidates && proposal.candidates.length > 0 && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f1f8f4',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#2e7d32' }}>
            Candidates:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {proposal.candidates.map((candidate, index) => (
              <span key={index} style={{
                padding: '6px 12px',
                backgroundColor: 'white',
                borderRadius: '16px',
                fontSize: '13px',
                border: '1px solid #4CAF50',
                color: '#2e7d32'
              }}>
                {candidate}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Voter management for owners */}
      {isOwner && !proposal.isFinished && (
        <ProposalVoterManager
          proposalId={proposal.id}
          onAddVoter={(address) => onAddVoter(address)}
          onAddVoters={(addresses) => onAddVoters(addresses)}
          isOwner={isOwner}
        />
      )}

      {/* Voting interface */}
      {proposal.votingType === VotingType.CANDIDATE_BASED ? (
        <CandidateVoting
          proposal={proposal}
          onVote={onVoteForCandidate}
          isLoading={isLoading}
        />
      ) : (
        <YesNoVoting
          proposal={proposal}
          onVote={onVoteYesNo}
          isLoading={isLoading}
        />
      )}

      {/* Finish voting button (owner only) */}
      {isOwner && (
        <FinishVotingButton
          proposalId={proposal.id}
          onFinishVoting={onFinishVoting}
          isOwner={isOwner}
          isFinished={proposal.isFinished}
        />
      )}

      {/* Results display */}
      {proposal.isFinished && (
        <ResultsDisplay proposal={proposal} />
      )}
    </div>
  );
}
