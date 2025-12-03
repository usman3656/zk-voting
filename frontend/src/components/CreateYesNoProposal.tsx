import { useState } from 'react';

interface CreateYesNoProposalProps {
  onCreateProposal: (description: string) => Promise<void>;
  isOwner: boolean;
}

export function CreateYesNoProposal({ onCreateProposal, isOwner }: CreateYesNoProposalProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateProposal = async () => {
    if (!description.trim()) {
      setError('Please enter a proposal description');
      return;
    }

    if (description.trim().length < 3) {
      setError('Proposal description must be at least 3 characters');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onCreateProposal(description.trim());
      setDescription('');
      setSuccess('✅ Yes/No proposal created successfully!');
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
    return null;
  }

  return (
    <div style={{
      border: '2px solid #2196F3',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#e3f2fd',
      marginBottom: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#1976D2' }}>❓ Create Yes/No Proposal</h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        Create a simple yes/no question. Voters will vote Yes or No, and the majority wins.
      </p>
      
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
          Question
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError(null);
          }}
          placeholder="e.g., Should we implement online classes for next semester?"
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
          {description.length}/500 characters
        </div>
      </div>

      <button
        onClick={handleCreateProposal}
        disabled={isLoading || !description.trim() || description.trim().length < 3}
        style={{
          padding: '12px 24px',
          backgroundColor: isLoading || !description.trim() || description.trim().length < 3 ? '#ccc' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading || !description.trim() || description.trim().length < 3 ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          minWidth: '150px'
        }}
      >
        {isLoading ? '⏳ Creating...' : '✨ Create Proposal'}
      </button>
    </div>
  );
}

