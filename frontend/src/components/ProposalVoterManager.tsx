import { useState } from 'react';

interface ProposalVoterManagerProps {
  proposalId: bigint;
  onAddVoter: (voterAddress: string) => Promise<void>;
  onAddVoters: (voterAddresses: string[]) => Promise<void>;
  isOwner: boolean;
}

export function ProposalVoterManager({ proposalId, onAddVoter, onAddVoters, isOwner }: ProposalVoterManagerProps) {
  const [voterAddress, setVoterAddress] = useState('');
  const [votersList, setVotersList] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mode, setMode] = useState<'single' | 'multiple'>('single');

  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
  };

  const handleAddSingleVoter = async () => {
    if (!voterAddress.trim()) {
      setError('Please enter a voter address');
      return;
    }

    if (!isValidAddress(voterAddress.trim())) {
      setError('Invalid Ethereum address format');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onAddVoter(voterAddress.trim());
      setVoterAddress('');
      setSuccess('✅ Voter added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add voter';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMultipleVoters = async () => {
    if (!votersList.trim()) {
      setError('Please enter voter addresses');
      return;
    }

    const addresses = votersList
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (addresses.length === 0) {
      setError('Please enter at least one voter address');
      return;
    }

    // Validate all addresses
    const invalidAddresses = addresses.filter(addr => !isValidAddress(addr));
    if (invalidAddresses.length > 0) {
      setError(`Invalid address(es): ${invalidAddresses.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onAddVoters(addresses);
      setVotersList('');
      setSuccess(`✅ ${addresses.length} voter(s) added successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add voters';
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
      border: '2px solid #FF9800',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#fff3e0',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginTop: 0, color: '#E65100' }}>👥 Add Voters to Proposal #{proposalId.toString()}</h3>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
        Add eligible voters for this specific proposal. Only added voters can vote on this proposal.
      </p>

      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={() => {
            setMode('single');
            setError(null);
            setSuccess(null);
          }}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: mode === 'single' ? '#FF9800' : '#ddd',
            color: mode === 'single' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Single Voter
        </button>
        <button
          onClick={() => {
            setMode('multiple');
            setError(null);
            setSuccess(null);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: mode === 'multiple' ? '#FF9800' : '#ddd',
            color: mode === 'multiple' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Multiple Voters
        </button>
      </div>

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

      {mode === 'single' ? (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Voter Address
          </label>
          <input
            type="text"
            value={voterAddress}
            onChange={(e) => {
              setVoterAddress(e.target.value);
              setError(null);
            }}
            placeholder="0x..."
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '10px',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={handleAddSingleVoter}
            disabled={isLoading || !voterAddress.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading || !voterAddress.trim() ? '#ccc' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !voterAddress.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? '⏳ Adding...' : '➕ Add Voter'}
          </button>
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Voter Addresses (one per line)
          </label>
          <textarea
            value={votersList}
            onChange={(e) => {
              setVotersList(e.target.value);
              setError(null);
            }}
            placeholder="0x...&#10;0x...&#10;0x..."
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical',
              marginBottom: '10px'
            }}
          />
          <button
            onClick={handleAddMultipleVoters}
            disabled={isLoading || !votersList.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isLoading || !votersList.trim() ? '#ccc' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading || !votersList.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? '⏳ Adding...' : `➕ Add ${votersList.split('\n').filter(l => l.trim()).length} Voter(s)`}
          </button>
        </div>
      )}
    </div>
  );
}

