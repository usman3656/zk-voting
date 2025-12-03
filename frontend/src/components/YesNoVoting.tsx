import { useState } from 'react';
import type { Proposal } from '../types/proposal';

interface YesNoVotingProps {
  proposal: Proposal;
  onVote: (isYes: boolean) => Promise<void>;
  isLoading?: boolean;
}

export function YesNoVoting({ proposal, onVote, isLoading = false }: YesNoVotingProps) {
  const [selectedChoice, setSelectedChoice] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async () => {
    if (selectedChoice === null) {
      setError('Please select Yes or No');
      return;
    }

    setError(null);
    try {
      await onVote(selectedChoice);
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
          ✓ You voted: {proposal.voterChoice || 'Unknown'}
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

  return (
    <div style={{ marginTop: '15px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
          Your vote:
        </label>
        <div style={{ display: 'flex', gap: '15px' }}>
          <label
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              border: selectedChoice === true ? '3px solid #4CAF50' : '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: selectedChoice === true ? '#e8f5e9' : 'white',
              transition: 'all 0.2s',
              fontSize: '18px',
              fontWeight: 'bold',
              color: selectedChoice === true ? '#2e7d32' : '#666'
            }}
          >
            <input
              type="radio"
              name={`yesno-${proposal.id}`}
              checked={selectedChoice === true}
              onChange={() => {
                setSelectedChoice(true);
                setError(null);
              }}
              style={{ marginRight: '10px', width: '20px', height: '20px' }}
            />
            ✅ Yes
          </label>
          <label
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              border: selectedChoice === false ? '3px solid #f44336' : '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: selectedChoice === false ? '#ffebee' : 'white',
              transition: 'all 0.2s',
              fontSize: '18px',
              fontWeight: 'bold',
              color: selectedChoice === false ? '#c62828' : '#666'
            }}
          >
            <input
              type="radio"
              name={`yesno-${proposal.id}`}
              checked={selectedChoice === false}
              onChange={() => {
                setSelectedChoice(false);
                setError(null);
              }}
              style={{ marginRight: '10px', width: '20px', height: '20px' }}
            />
            ❌ No
          </label>
        </div>
        {(proposal.yesCount !== undefined || proposal.noCount !== undefined) && (
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <span>Yes: {proposal.yesCount?.toString() || '0'} votes</span>
            <span>No: {proposal.noCount?.toString() || '0'} votes</span>
          </div>
        )}
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
        disabled={isLoading || selectedChoice === null}
        style={{
          width: '100%',
          padding: '12px 24px',
          backgroundColor: isLoading || selectedChoice === null ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading || selectedChoice === null ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? '⏳ Voting...' : `🗳️ Vote ${selectedChoice === true ? 'Yes' : selectedChoice === false ? 'No' : ''}`}
      </button>
    </div>
  );
}

