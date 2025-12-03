import { useState } from 'react';
import type { Proposal } from '../types/proposal';

interface CandidateVotingProps {
  proposal: Proposal;
  onVote: (candidateName: string) => Promise<void>;
  isLoading?: boolean;
}

export function CandidateVoting({ proposal, onVote, isLoading = false }: CandidateVotingProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    setError(null);
    try {
      await onVote(selectedCandidate);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to vote';
      setError(errorMsg);
    }
  };

  if (proposal.isFinished) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginTop: '15px'
      }}>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          Voting has ended
        </div>
      </div>
    );
  }

  if (proposal.hasVoted) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#e8f5e9',
        borderRadius: '8px',
        marginTop: '15px'
      }}>
        <div style={{ fontSize: '14px', color: '#2e7d32', fontWeight: 'bold' }}>
          ✓ You voted for: {proposal.voterChoice || 'Unknown'}
        </div>
      </div>
    );
  }

  if (!proposal.canVote) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#fff3e0',
        borderRadius: '8px',
        marginTop: '15px'
      }}>
        <div style={{ fontSize: '14px', color: '#E65100' }}>
          ⚠️ You are not eligible to vote on this proposal
        </div>
      </div>
    );
  }

  if (!proposal.candidates || proposal.candidates.length === 0) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#ffebee',
        borderRadius: '8px',
        marginTop: '15px'
      }}>
        <div style={{ fontSize: '14px', color: '#c62828' }}>
          No candidates available
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '15px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
          Select a candidate to vote:
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {proposal.candidates.map((candidate, index) => (
            <label
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: selectedCandidate === candidate ? '2px solid #4CAF50' : '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedCandidate === candidate ? '#f1f8f4' : 'white',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="radio"
                name={`candidate-${proposal.id}`}
                value={candidate}
                checked={selectedCandidate === candidate}
                onChange={(e) => {
                  setSelectedCandidate(e.target.value);
                  setError(null);
                }}
                style={{ marginRight: '10px', width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '15px', fontWeight: '500' }}>{candidate}</span>
              {proposal.candidateVotes && proposal.candidateVotes[candidate] !== undefined && (
                <span style={{ marginLeft: 'auto', color: '#666', fontSize: '14px' }}>
                  {proposal.candidateVotes[candidate].toString()} votes
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleVote}
        disabled={isLoading || !selectedCandidate}
        style={{
          width: '100%',
          padding: '12px 24px',
          backgroundColor: isLoading || !selectedCandidate ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading || !selectedCandidate ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? '⏳ Voting...' : '🗳️ Vote for Selected Candidate'}
      </button>
    </div>
  );
}

