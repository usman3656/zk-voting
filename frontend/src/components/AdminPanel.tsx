import { useState } from 'react';

interface AdminPanelProps {
  onRegisterVoter: (address: string) => Promise<void>;
  onRegisterVoters: (addresses: string[]) => Promise<void>;
}

export function AdminPanel({ onRegisterVoter, onRegisterVoters }: AdminPanelProps) {
  const [voterAddress, setVoterAddress] = useState('');
  const [bulkVoters, setBulkVoters] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRegisterVoter = async () => {
    if (!voterAddress.trim()) {
      setError('Please enter a voter address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(voterAddress)) {
      setError('Invalid Ethereum address');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onRegisterVoter(voterAddress);
      setVoterAddress('');
      setSuccess('Voter registered successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register voter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterBulkVoters = async () => {
    if (!bulkVoters.trim()) {
      setError('Please enter voter addresses');
      return;
    }

    const addresses = bulkVoters
      .split(/[,\n]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addresses.length === 0) {
      setError('Please enter at least one address');
      return;
    }

    const invalidAddresses = addresses.filter(addr => !/^0x[a-fA-F0-9]{40}$/.test(addr));
    if (invalidAddresses.length > 0) {
      setError(`Invalid addresses: ${invalidAddresses.join(', ')}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onRegisterVoters(addresses);
      setBulkVoters('');
      setSuccess(`${addresses.length} voter(s) registered successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register voters');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      border: '2px solid #2196F3',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#e3f2fd',
      marginBottom: '20px'
    }}>
      <h2 style={{ marginTop: 0 }}>🔧 Admin Panel</h2>
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ padding: '10px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', marginBottom: '10px' }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Register Single Voter</h3>
        <input
          type="text"
          value={voterAddress}
          onChange={(e) => setVoterAddress(e.target.value)}
          placeholder="0x..."
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <button
          onClick={handleRegisterVoter}
          disabled={isLoading}
          style={{ padding: '8px 16px', cursor: isLoading ? 'wait' : 'pointer' }}
        >
          {isLoading ? 'Processing...' : 'Register Voter'}
        </button>
      </div>

      <div>
        <h3>Register Multiple Voters</h3>
        <textarea
          value={bulkVoters}
          onChange={(e) => setBulkVoters(e.target.value)}
          placeholder="Enter addresses separated by commas or new lines"
          style={{ width: '100%', minHeight: '100px', padding: '8px', marginBottom: '10px' }}
        />
        <button
          onClick={handleRegisterBulkVoters}
          disabled={isLoading}
          style={{ padding: '8px 16px', cursor: isLoading ? 'wait' : 'pointer' }}
        >
          {isLoading ? 'Processing...' : 'Register All Voters'}
        </button>
      </div>
    </div>
  );
}

