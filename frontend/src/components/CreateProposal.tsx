import { useState } from 'react';

interface CreateProposalProps {
  onCreateProposal: (description: string) => Promise<void>;
  isOwner: boolean;
}

export function CreateProposal({ onCreateProposal, isOwner }: CreateProposalProps) {
  const [proposalDesc, setProposalDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateProposal = async () => {
    if (!proposalDesc.trim()) {
      setError('Please enter a proposal description');
      return;
    }

    if (proposalDesc.trim().length < 10) {
      setError('Proposal description must be at least 10 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onCreateProposal(proposalDesc.trim());
      setProposalDesc('');
      setSuccess('✅ Proposal created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create proposal';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOwner) {
    return null; // Only show to owners
  }

  return (
    <div style={{
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#f1f8f4',
      marginBottom: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#2e7d32' }}>📝 Create New Proposal</h2>
      
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '15px',
          borderLeft: '4px solid #c62828'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {success && (
        <div style={{
          padding: '12px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '4px',
          marginBottom: '15px',
          borderLeft: '4px solid #4CAF50'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Proposal Description
        </label>
        <textarea
          value={proposalDesc}
          onChange={(e) => {
            setProposalDesc(e.target.value);
            setError(null);
          }}
          placeholder="Enter your proposal description here... (minimum 10 characters)"
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            marginBottom: '5px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
          maxLength={500}
        />
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'right' }}>
          {proposalDesc.length}/500 characters
        </div>
      </div>

      <button
        onClick={handleCreateProposal}
        disabled={isLoading || !proposalDesc.trim() || proposalDesc.trim().length < 10}
        style={{
          padding: '12px 24px',
          backgroundColor: isLoading || !proposalDesc.trim() || proposalDesc.trim().length < 10 ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading || !proposalDesc.trim() || proposalDesc.trim().length < 10 ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s',
          minWidth: '150px'
        }}
        onMouseOver={(e) => {
          if (!isLoading && proposalDesc.trim() && proposalDesc.trim().length >= 10) {
            e.currentTarget.style.backgroundColor = '#45a049';
          }
        }}
        onMouseOut={(e) => {
          if (!isLoading && proposalDesc.trim() && proposalDesc.trim().length >= 10) {
            e.currentTarget.style.backgroundColor = '#4CAF50';
          }
        }}
      >
        {isLoading ? '⏳ Creating...' : '✨ Create Proposal'}
      </button>
    </div>
  );
}

