import { useState, useEffect } from 'react';

interface VoteButtonProps {
  proposalId: bigint;
  proposalDescription: string;
  currentVotes: bigint;
  onVote: (proposalId: bigint) => Promise<void>;
  hasVoted: (proposalId: bigint) => Promise<boolean>;
  canVote: boolean;
  isOwner: boolean;
  isRegisteredVoter: boolean;
}

export function VoteButton({
  proposalId,
  proposalDescription,
  currentVotes,
  onVote,
  hasVoted,
  canVote,
  isOwner,
  isRegisteredVoter
}: VoteButtonProps) {
  const [voted, setVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (canVote) {
        setCheckingStatus(true);
        try {
          const status = await hasVoted(proposalId);
          setVoted(status);
        } catch (err) {
          console.error('Error checking vote status:', err);
        } finally {
          setCheckingStatus(false);
        }
      } else {
        setCheckingStatus(false);
      }
    };
    checkVoteStatus();
  }, [proposalId, canVote, hasVoted]);

  const handleVote = async () => {
    if (voted || isVoting || !canVote) return;

    // Confirm vote
    const confirmed = window.confirm(
      `Are you sure you want to vote for this proposal?\n\n"${proposalDescription}"\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setIsVoting(true);
    setError(null);

    try {
      await onVote(proposalId);
      setVoted(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to vote';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsVoting(false);
    }
  };

  if (checkingStatus) {
    return (
      <div style={{ padding: '8px', color: '#666', fontSize: '14px' }}>
        Checking vote status...
      </div>
    );
  }

  if (!isRegisteredVoter && !isOwner) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#fff3cd',
        borderRadius: '4px',
        border: '1px solid #ffc107',
        color: '#856404'
      }}>
        ⚠️ You are not a registered voter. Only registered voters can vote.
      </div>
    );
  }

  if (voted) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#d4edda',
        borderRadius: '4px',
        border: '1px solid #28a745',
        color: '#155724',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        ✅ You have already voted for this proposal
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '10px',
          borderLeft: '4px solid #c62828'
        }}>
          ⚠️ {error}
        </div>
      )}
      <button
        onClick={handleVote}
        disabled={isVoting || voted}
        style={{
          padding: '12px 24px',
          backgroundColor: isVoting || voted ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isVoting || voted ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          width: '100%',
          transition: 'background-color 0.3s',
          boxShadow: isVoting || voted ? 'none' : '0 2px 4px rgba(0,0,0,0.2)'
        }}
        onMouseOver={(e) => {
          if (!isVoting && !voted) {
            e.currentTarget.style.backgroundColor = '#1976D2';
          }
        }}
        onMouseOut={(e) => {
          if (!isVoting && !voted) {
            e.currentTarget.style.backgroundColor = '#2196F3';
          }
        }}
      >
        {isVoting ? '⏳ Submitting Vote...' : '🗳️ Vote for This Proposal'}
      </button>
      <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
        Current votes: <strong>{currentVotes.toString()}</strong>
      </div>
    </div>
  );
}

