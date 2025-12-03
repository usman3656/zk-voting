import { useState } from 'react';

interface FinishVotingButtonProps {
  proposalId: bigint;
  onFinishVoting: () => Promise<void>;
  isOwner: boolean;
  isFinished: boolean;
}

export function FinishVotingButton({ onFinishVoting, isOwner, isFinished }: FinishVotingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleFinishVoting = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onFinishVoting();
      setShowConfirm(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to finish voting';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  if (isFinished) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#e8f5e9',
        borderRadius: '4px',
        marginTop: '15px',
        textAlign: 'center'
      }}>
        <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>✓ Voting Finished</span>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div style={{ marginTop: '15px' }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          marginBottom: '10px',
          border: '2px solid #FF9800'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#E65100' }}>
            ⚠️ Are you sure you want to finish voting?
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Once finished, no more votes can be cast. This action cannot be undone.
          </p>
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleFinishVoting}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: isLoading ? '#ccc' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? '⏳ Finishing...' : '✓ Confirm Finish Voting'}
          </button>
          <button
            onClick={() => {
              setShowConfirm(false);
              setError(null);
            }}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      style={{
        width: '100%',
        padding: '12px 24px',
        backgroundColor: '#FF9800',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        marginTop: '15px'
      }}
    >
      🏁 Finish Voting
    </button>
  );
}

