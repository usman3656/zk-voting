import { useState } from 'react';
import { generateMerkleTree } from '../utils/merkleTree';

interface CreateZKProposalProps {
  onCreateZKProposal: (description: string, candidates: string[], merkleRoot: string) => Promise<bigint>;
  isOwner: boolean;
}

export function CreateZKProposal({ onCreateZKProposal, isOwner }: CreateZKProposalProps) {
  const [description, setDescription] = useState('');
  const [candidates, setCandidates] = useState<string[]>(['']);
  const [voterAddresses, setVoterAddresses] = useState<string>('');
  const [merkleRoot, setMerkleRoot] = useState<string>('');
  const [isGeneratingMerkle, setIsGeneratingMerkle] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voterSecrets, setVoterSecrets] = useState<Record<string, string>>({});

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

  const generateMerkleTreeFromAddresses = async (addresses: string[]) => {
    setIsGeneratingMerkle(true);
    setError(null);

    try {
      // Validate addresses
      for (const addr of addresses) {
        if (!addr.startsWith('0x') || addr.length !== 42) {
          throw new Error(`Invalid address: ${addr}. Addresses must start with 0x and be 42 characters long.`);
        }
      }

      console.log('═══════════════════════════════════════════════════════════');
      console.log('🖥️  FRONTEND: Creating ZK Proposal - Merkle Tree Generation');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`📋 Input addresses: ${addresses.length}`);
      addresses.forEach((addr, i) => console.log(`    [${i}]: ${addr}`));
      console.log(`📏 Expected circuit depth: 5 levels`);
      console.log(`📏 Expected max leaves: 32 (2^5)`);
      console.log('');

      const { root, secrets } = await generateMerkleTree(addresses);
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ FRONTEND: Merkle Tree Generated');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`📊 Computed root: ${root}`);
      console.log(`📊 Root (decimal): ${BigInt(root).toString()}`);
      console.log(`📊 This root will be stored on-chain`);
      console.log(`📊 When voting, the circuit will compute from leaf through 5 levels`);
      console.log(`📊 The circuit's computed root MUST match this stored root`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');

      setMerkleRoot(root);
      setVoterSecrets(secrets);
      return { root, secrets };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate Merkle tree';
      setError(errorMsg);
      throw err;
    } finally {
      setIsGeneratingMerkle(false);
    }
  };

  const handleGenerateMerkleTree = async () => {
    if (!voterAddresses.trim()) {
      setError('Please enter at least one voter address');
      return;
    }

    setMerkleRoot('');
    setVoterSecrets({});

    const addresses = voterAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addresses.length === 0) {
      setError('Please enter at least one valid voter address');
      return;
    }

    try {
      await generateMerkleTreeFromAddresses(addresses);
      setSuccess(`✅ Merkle tree generated! Root: ${merkleRoot.substring(0, 10)}...`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      // Error already set in generateMerkleTreeFromAddresses
      setTimeout(() => setError(null), 5000);
    }
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

    // Auto-generate Merkle tree if not already generated
    if (!merkleRoot) {
      const addresses = voterAddresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0 && addr.startsWith('0x') && addr.length === 42);

      if (addresses.length === 0) {
        setError('Please enter at least one valid voter address');
        return;
      }

      setIsLoading(true);
      try {
        await generateMerkleTreeFromAddresses(addresses);
      } catch (err) {
        setIsLoading(false);
        return; // Error already set
      }
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
      // Get proposal ID from the contract call
      const proposalId = await onCreateZKProposal(description.trim(), validCandidates.map(c => c.trim()), merkleRoot);
      
      // Store voter addresses in localStorage for later retrieval
      const addresses = voterAddresses
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0 && addr.startsWith('0x') && addr.length === 42);
      
      if (addresses.length > 0) {
        const storageKey = `zk_proposal_${proposalId}_addresses`;
        localStorage.setItem(storageKey, JSON.stringify(addresses));
        console.log(`✅ Stored ${addresses.length} voter addresses for proposal ${proposalId} in localStorage`);
        
        // Also store in a global map for immediate access
        const win = window as any;
        if (!win.zkProposalAddresses) {
          win.zkProposalAddresses = {};
        }
        win.zkProposalAddresses[proposalId.toString()] = addresses;
      }
      
      setDescription('');
      setCandidates(['']);
      setVoterAddresses('');
      setMerkleRoot('');
      setVoterSecrets({});
      setSuccess('✅ ZK proposal created successfully!');
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
      border: '2px solid #9C27B0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      backgroundColor: '#f3e5f5'
    }}>
      <h2 style={{ marginTop: 0, color: '#7B1FA2' }}>🔐 Create ZK Anonymous Proposal</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
        Create an anonymous voting proposal using zero-knowledge proofs. Voters can vote without revealing their identity.
      </p>
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '4px', 
        marginBottom: '15px',
        fontSize: '13px'
      }}>
        <strong>How it works:</strong>
        <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li><strong>Enter voter addresses</strong> - these define who can vote (one-time, cannot be changed later)</li>
          <li><strong>Merkle tree is generated</strong> automatically when you create the proposal</li>
          <li><strong>Only the tree root (hash) is stored on-chain</strong> - addresses stay completely private</li>
          <li><strong>Voters use their secret</strong> to prove eligibility without revealing identity</li>
        </ol>
        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
          ⚠️ <strong>Important:</strong> The voter list is <strong>fixed at creation time</strong>. You cannot add or remove voters after the proposal is created. Make sure to include all eligible voters when creating the proposal.
        </div>
      </div>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '10px',
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          {success}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Proposal Description:
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter proposal description..."
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            minHeight: '60px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Candidates:
        </label>
        {candidates.map((candidate, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={candidate}
              onChange={(e) => updateCandidate(index, e.target.value)}
              placeholder={`Candidate ${index + 1}`}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
            {candidates.length > 1 && (
              <button
                onClick={() => removeCandidateField(index)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
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
              padding: '8px 15px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '5px'
            }}
          >
            + Add Candidate
          </button>
        )}
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Eligible Voter Addresses (one per line):
        </label>
        <textarea
          value={voterAddresses}
          onChange={(e) => setVoterAddresses(e.target.value)}
          placeholder="0x1234...\n0x5678...\n0x9abc..."
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            minHeight: '100px',
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={handleGenerateMerkleTree}
            disabled={isGeneratingMerkle || !voterAddresses.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: isGeneratingMerkle ? '#ccc' : '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isGeneratingMerkle ? 'not-allowed' : 'pointer'
            }}
          >
            {isGeneratingMerkle ? 'Generating...' : '🔐 Preview Merkle Tree'}
          </button>
          <span style={{ fontSize: '12px', color: '#666' }}>
            (Optional - tree will auto-generate when creating proposal)
          </span>
        </div>
        <div style={{ marginTop: '5px', fontSize: '11px', color: '#666' }}>
          💡 <strong>Why a Merkle tree?</strong> The tree creates a cryptographic proof that voters are eligible without storing addresses on-chain. Only the root (hash) is stored, keeping voter lists completely private. The tree is generated automatically when you create the proposal.
        </div>
      </div>

      {merkleRoot && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e1bee7',
          borderRadius: '4px',
          marginBottom: '15px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>✅ Merkle Root Generated:</div>
          <div style={{ fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all' }}>
            {merkleRoot}
          </div>
          {Object.keys(voterSecrets).length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Voter Secrets (save these!):</div>
              <div style={{ maxHeight: '150px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px' }}>
                {Object.entries(voterSecrets).map(([address, secret]) => (
                  <div key={address} style={{ marginBottom: '5px' }}>
                    <strong>{address.substring(0, 10)}...</strong>: {secret}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                ⚠️ These secrets are needed for voters to cast ZK votes. Share them securely!
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleCreateProposal}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          backgroundColor: isLoading ? '#ccc' : '#9C27B0',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        {isLoading ? 'Creating...' : '🔐 Create ZK Proposal'}
      </button>
    </div>
  );
}
