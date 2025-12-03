import { useState } from 'react';

interface CreateCandidateProposalProps {
  onCreateProposal: (description: string, candidates: string[]) => Promise<void>;
  isOwner: boolean;
}

export function CreateCandidateProposal({ onCreateProposal, isOwner }: CreateCandidateProposalProps) {
  const [description, setDescription] = useState('');
  const [candidates, setCandidates] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const addCandidateField = () => {
    if (candidates.length < 50) {
      setCandidates([...candidates, '']);
    }
  };

  const removeCandidateField = (index: number) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index: number, value: string) => {
    const newCandidates = [...candidates];
    newCandidates[index] = value;
    setCandidates(newCandidates);
  };

  const handleCreateProposal = async () => {
    if (!description.trim()) {
      setError('Please enter a proposal description');
      return;
    }

    const validCandidates = candidates.filter(c => c.trim() !== '');
    if (validCandidates.length === 0) {
      setError('Please enter at least one candidate');
      return;
    }

    if (validCandidates.length < 2) {
      setError('Please enter at least two candidates');
      return;
    }

    // Check for duplicate candidates
    const uniqueCandidates = new Set(validCandidates.map(c => c.trim().toLowerCase()));
    if (uniqueCandidates.size !== validCandidates.length) {
      setError('Duplicate candidates are not allowed');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onCreateProposal(description.trim(), validCandidates.map(c => c.trim()));
      setDescription('');
      setCandidates(['']);
      setSuccess('✅ Candidate proposal created successfully!');
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
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#f1f8f4',
      marginBottom: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#2e7d32' }}>📋 Create Candidate-Based Proposal</h2>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        Create a proposal with multiple candidates. Voters will choose one candidate, and the one with the most votes wins.
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
          Proposal Description
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError(null);
          }}
          placeholder="e.g., Student Council President Election 2024"
          style={{
            width: '100%',
            minHeight: '80px',
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

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Candidates ({candidates.filter(c => c.trim()).length} entered, max 50)
        </label>
        {candidates.map((candidate, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={candidate}
              onChange={(e) => updateCandidate(index, e.target.value)}
              placeholder={`Candidate ${index + 1} name`}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            {candidates.length > 1 && (
              <button
                onClick={() => removeCandidateField(index)}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {candidates.length < 50 && (
          <button
            onClick={addCandidateField}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: '5px'
            }}
          >
            + Add Candidate
          </button>
        )}
      </div>

      <button
        onClick={handleCreateProposal}
        disabled={isLoading || !description.trim() || candidates.filter(c => c.trim()).length < 2}
        style={{
          padding: '12px 24px',
          backgroundColor: isLoading || !description.trim() || candidates.filter(c => c.trim()).length < 2 ? '#ccc' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading || !description.trim() || candidates.filter(c => c.trim()).length < 2 ? 'not-allowed' : 'pointer',
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

