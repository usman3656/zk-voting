import { useState, useEffect } from 'react';
import { generateZKProof, formatProofForContract, generateNullifier, generateVoteCommitment } from '../utils/zkVoting';
import type { ZKVoteInputs } from '../utils/zkVoting';
import { useVoting } from '../hooks/useVoting';
import { useWallet } from '../hooks/useWallet';
import { getVoterCredentials } from '../utils/merkleTree';

interface ZKVotingProps {
  proposalId: number;
  candidates: string[];
  merkleRoot: string;
  voterAddresses?: string[]; // Optional: if provided, we can auto-generate credentials
  voterData?: {
    secret: string;
    proof: string[];
    indices: number[];
  };
}

export function ZKVoting({ proposalId, candidates, merkleRoot, voterAddresses, voterData }: ZKVotingProps) {
  const wallet = useWallet();
  const { contract } = useVoting(wallet.provider, wallet.account);
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [currentVoterData, setCurrentVoterData] = useState<{ secret: string; proof: string[]; indices: number[] } | null>(voterData || null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [manualSecret, setManualSecret] = useState<string>('');

  // Try to auto-generate credentials if voterAddresses are provided
  useEffect(() => {
    if (voterAddresses && voterAddresses.length > 0 && wallet.account && !currentVoterData) {
      setIsLoadingCredentials(true);
      getVoterCredentials(voterAddresses, wallet.account)
        .then(data => {
          if (data) {
            setCurrentVoterData(data);
          }
        })
        .catch(err => {
          console.error('Failed to generate credentials:', err);
        })
        .finally(() => {
          setIsLoadingCredentials(false);
        });
    }
  }, [voterAddresses, wallet.account, currentVoterData]);

  // Check if voter has data
  const hasVoterData = currentVoterData && currentVoterData.secret && currentVoterData.proof && currentVoterData.indices;

  const handleVote = async () => {
    if (!selectedCandidate && selectedCandidate !== 0) {
      setError('Please select a candidate');
      return;
    }

    if (!hasVoterData) {
      setError('Voter credentials not found. Please enter your secret or contact the administrator.');
      return;
    }

    if (!contract) {
      setError('Contract not connected');
      return;
    }

    setIsGeneratingProof(true);
    setError(null);
    setStatus('Generating ZK proof...');

    try {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🚀 STARTING ZK VOTE GENERATION');
      console.log('═══════════════════════════════════════════════════════════');
      
      // Convert inputs to bigint
      const proposalIdBigInt = BigInt(proposalId);
      const merkleRootBigInt = BigInt(merkleRoot);
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🖥️  FRONTEND: Starting ZK Vote Generation');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📥 INPUTS:');
      console.log('  proposalId:', proposalIdBigInt.toString());
      console.log('  merkleRoot (from contract):', merkleRootBigInt.toString());
      console.log('  merkleRoot (hex):', merkleRoot);
      console.log('  selectedCandidate:', selectedCandidate);
      console.log('  numCandidates:', candidates.length);
      console.log('  voterData exists:', !!currentVoterData);
      console.log('  voterData.secret:', currentVoterData!.secret);
      console.log('  voterData.proof length:', currentVoterData!.proof.length);
      console.log('  voterData.indices length:', currentVoterData!.indices.length);
      console.log('');
      console.log('⚠️  CRITICAL CHECK:');
      console.log(`  Circuit depth: 5 levels`);
      console.log(`  Path elements: ${currentVoterData!.proof.length} (expected: 5)`);
      console.log(`  Path indices: ${currentVoterData!.indices.length} (expected: 5)`);
      if (currentVoterData!.proof.length !== 5 || currentVoterData!.indices.length !== 5) {
        console.error(`  ❌ MISMATCH: Proof has ${currentVoterData!.proof.length} elements, expected 5`);
        console.error(`  ❌ This proposal was created with OLD code (depth 20 or padding)`);
        console.error(`  ❌ You need to create a NEW proposal with updated code`);
      } else {
        console.log(`  ✅ Proof structure matches (5 elements)`);
      }
      console.log('');
      
      // IMPORTANT: The circuit expects voterSecret to be the LEAF value (hash of secret), not the raw secret
      // We need to hash the secret to get the leaf value
      console.log('🔐 COMPUTING LEAF VALUE:');
      const { buildPoseidon } = await import('circomlibjs');
      const poseidon = await buildPoseidon();
      const secretBigInt = BigInt(currentVoterData!.secret);
      console.log('  Raw secret (bigint):', secretBigInt.toString());
      
      const leafHash = poseidon([secretBigInt]);
      const leafHashHex = Array.from(leafHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
      const voterSecretBigInt = BigInt('0x' + leafHashHex); // This is the leaf value (hash of secret)
      console.log('  Leaf hash (voterSecret):', voterSecretBigInt.toString());
      console.log('');
      
      const candidateIndexBigInt = BigInt(selectedCandidate);
      const numCandidatesBigInt = BigInt(candidates.length);
      
      // Process proof data - should already be exactly 5 elements (full tree)
      console.log('📋 PROCESSING PROOF DATA:');
      const pathElementsBigInt = currentVoterData!.proof.map(p => BigInt(p));
      const pathIndices = currentVoterData!.indices;
      
      // Verify we have exactly 5 elements (should always be the case with full tree)
      const CIRCUIT_LEVELS = 5;
      if (pathElementsBigInt.length !== CIRCUIT_LEVELS) {
        throw new Error(`Expected ${CIRCUIT_LEVELS} pathElements, got ${pathElementsBigInt.length}. Please recreate the proposal.`);
      }
      if (pathIndices.length !== CIRCUIT_LEVELS) {
        throw new Error(`Expected ${CIRCUIT_LEVELS} pathIndices, got ${pathIndices.length}. Please recreate the proposal.`);
      }
      
      console.log('  pathElements length:', pathElementsBigInt.length);
      console.log('  pathIndices length:', pathIndices.length);
      console.log('  PathIndices:', pathIndices.join(', '));
      console.log('');

      // CRITICAL FIX: The circuit computes nullifier as hash(voterSecret, proposalId)
      // where voterSecret is the LEAF value (hash of secret), not the raw secret
      // Circuit line 62-64: nullifierHash.inputs[0] <== voterSecret; nullifierHash.out === nullifier;
      console.log('🔑 GENERATING NULLIFIER:');
      console.log('  ⚠️ Using voterSecret (leaf hash) for nullifier, NOT raw secret');
      console.log('  voterSecret (leaf):', voterSecretBigInt.toString());
      console.log('  proposalId:', proposalIdBigInt.toString());
      const nullifier = await generateNullifier(voterSecretBigInt, proposalIdBigInt);
      console.log('  Nullifier:', nullifier.toString());
      console.log('');

      // DEBUG: Verify Merkle path computation before generating proof
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔍 VERIFYING MERKLE PATH (BEFORE PROOF GENERATION)');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📋 INPUTS TO DEBUG:');
      console.log('  voterSecret (leaf):', voterSecretBigInt.toString());
      console.log('  merkleRoot (expected):', merkleRootBigInt.toString());
      console.log('  pathElements count:', pathElementsBigInt.length);
      console.log('  pathIndices count:', pathIndices.length);
      console.log('  pathIndices:', pathIndices.join(', '));
      console.log('');
      
      // CRITICAL: Also verify that we can regenerate the tree and get the same root
      console.log('🔄 VERIFYING: Can we regenerate the tree and get the same root?');
      try {
        if (voterAddresses && voterAddresses.length > 0) {
          const { generateMerkleTree } = await import('../utils/merkleTree');
          const regenerated = await generateMerkleTree(voterAddresses);
          const regeneratedRootBigInt = BigInt(regenerated.root);
          console.log('  Regenerated root:', regeneratedRootBigInt.toString());
          console.log('  Stored root:     ', merkleRootBigInt.toString());
          const rootsMatch = regeneratedRootBigInt === merkleRootBigInt;
          console.log('  Match:', rootsMatch ? '✅ YES' : '❌ NO');
          if (!rootsMatch) {
            console.error('⚠️  WARNING: The stored root does not match the regenerated root!');
            console.error('   This means the proposal was created with different code or different addresses.');
            console.error('   You need to create a NEW proposal with the current code.');
            setError(`Merkle root mismatch. The stored root (${merkleRootBigInt.toString().slice(0, 20)}...) does not match the regenerated root (${regeneratedRootBigInt.toString().slice(0, 20)}...). Please create a new ZK proposal.`);
            setIsGeneratingProof(false);
            return;
          }
          console.log('');
        } else {
          console.log('  ⚠️  Voter addresses not available, skipping regeneration check');
          console.log('');
        }
      } catch (regenError) {
        console.error('⚠️  Could not regenerate tree:', regenError);
        // Continue anyway
      }
      
      // Compute all intermediate hashes in JavaScript (no Poseidon in circuit!)
      console.log('🔄 Computing intermediate hashes in JavaScript...');
      const { debugMerklePath } = await import('../utils/debugMerkle');
      const debugResult = await debugMerklePath(
        voterSecretBigInt,
        pathElementsBigInt,
        pathIndices,
        merkleRootBigInt
      );
      
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📊 INTERMEDIATE HASHES COMPUTED:');
      console.log('  Computed root:', debugResult.computed.toString());
      console.log('  Expected root:', debugResult.expected.toString());
      console.log('  Match:', debugResult.matches ? '✅ YES' : '❌ NO');
      console.log('  Intermediate hashes:', debugResult.steps.length);
      debugResult.steps.forEach((step, i) => {
        console.log(`    intermediate[${i}]: ${step.toString()}`);
      });
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      
      if (!debugResult.matches) {
        console.error('❌ MERKLE PATH MISMATCH - ABORTING PROOF GENERATION');
        console.error('⚠️  This usually means the proposal was created with OLD code (depth 20 or padding)');
        console.error('⚠️  You need to create a NEW ZK proposal with the updated code (depth 5)');
        setError(`Merkle path verification failed. The stored root doesn't match the computed root. This proposal was likely created with old code. Please create a new ZK proposal. Computed: ${debugResult.computed.toString().slice(0, 20)}..., Expected: ${debugResult.expected.toString().slice(0, 20)}...`);
        setIsGeneratingProof(false);
        return;
      }
      
      // Extract intermediate hashes (all computed in JavaScript)
      const intermediateHashes = debugResult.steps;
      console.log('✅ All intermediate hashes computed in JavaScript');
      console.log(`   Passing ${intermediateHashes.length} intermediate hashes to circuit`);
      console.log('   Circuit will only verify equality (no Poseidon computation)');
      console.log('');

      // Prepare circuit inputs (with intermediate hashes computed in JavaScript)
      const inputs: ZKVoteInputs = {
        proposalId: proposalIdBigInt,
        merkleRoot: merkleRootBigInt,
        nullifier,
        numCandidates: numCandidatesBigInt,
        voterSecret: voterSecretBigInt,
        candidateIndex: candidateIndexBigInt,
        pathElements: pathElementsBigInt,
        pathIndices,
        intermediateHashes: intermediateHashes // All computed in JavaScript!
      };

      // Generate ZK proof
      console.log('⚙️ GENERATING ZK PROOF:');
      setStatus('Computing zero-knowledge proof (this may take 10-30 seconds)...');
      
      // Paths to circuit files (adjust based on your setup)
      const wasmPath = '/circuits/build/vote.wasm';
      const zkeyPath = '/circuits/build/vote_final.zkey';
      console.log('  WASM path:', wasmPath);
      console.log('  zkey path:', zkeyPath);
      console.log('');

      const zkProof = await generateZKProof(inputs, wasmPath, zkeyPath);
      console.log('✅ PROOF GENERATION COMPLETE');
      console.log('');
      
      // Format proof for contract
      console.log('📦 FORMATTING PROOF FOR CONTRACT:');
      const { proof, publicInputs } = formatProofForContract(zkProof);
      console.log('  Proof formatted:');
      console.log('    a[0]:', proof[0].toString().slice(0, 30) + '...');
      console.log('    a[1]:', proof[1].toString().slice(0, 30) + '...');
      console.log('    b[0][0]:', proof[2][0].toString().slice(0, 30) + '...');
      console.log('    b[0][1]:', proof[2][1].toString().slice(0, 30) + '...');
      console.log('    b[1][0]:', proof[3][0].toString().slice(0, 30) + '...');
      console.log('    b[1][1]:', proof[3][1].toString().slice(0, 30) + '...');
      console.log('    c[0]:', proof[4].toString().slice(0, 30) + '...');
      console.log('    c[1]:', proof[5].toString().slice(0, 30) + '...');
      console.log('  Public inputs:');
      console.log('    [0] proposalId:', publicInputs[0].toString());
      console.log('    [1] merkleRoot:', publicInputs[1].toString());
      console.log('    [2] nullifier:', publicInputs[2].toString());
      console.log('    [3] numCandidates:', publicInputs[3].toString());
      console.log('');

      // Generate vote commitment (uses raw secret, which is correct for commitment)
      console.log('📝 GENERATING VOTE COMMITMENT:');
      const commitment = await generateVoteCommitment(selectedCandidate, currentVoterData!.secret);
      console.log('  Commitment:', commitment);
      console.log('');

      // Convert proof to contract format
      // Solidity expects: [a0, a1, [b00, b01], [b10, b11], c0, c1]
      const proofArray: [bigint, bigint, [bigint, bigint], [bigint, bigint], bigint, bigint] = [
        proof[0],
        proof[1],
        proof[2],
        proof[3],
        proof[4],
        proof[5]
      ];

      // Submit vote to contract
      console.log('📤 SUBMITTING VOTE TO CONTRACT:');
      console.log('  Proposal ID:', proposalId.toString());
      console.log('  Commitment:', commitment);
      console.log('  Gas limit: 5000000');
      setStatus('Submitting vote to blockchain...');
      
      console.log('  Calling contract.voteWithZK()...');
      const tx = await contract.voteWithZK(
        proposalId,
        proofArray as any,
        publicInputs as any,
        commitment,
        { gasLimit: 5000000 } // ZK verification requires more gas
      );
      console.log('  ✅ Transaction sent');
      console.log('  Transaction hash:', tx.hash);
      console.log('');

      setStatus('Waiting for transaction confirmation...');
      console.log('  Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      console.log('  ✅ Transaction confirmed');
      console.log('  Block number:', receipt.blockNumber);
      console.log('  Gas used:', receipt.gasUsed.toString());
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🎉 VOTE SUBMITTED SUCCESSFULLY!');
      console.log('═══════════════════════════════════════════════════════════');
      
      setStatus('✅ Vote submitted successfully! Your vote is anonymous.');
      setSelectedCandidate(null);
    } catch (err: any) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('❌ VOTE SUBMISSION FAILED');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));
      if (err instanceof Error && err.stack) {
        console.error('Stack trace:');
        console.error(err.stack);
      }
      if (err && typeof err === 'object' && 'data' in err) {
        console.error('Error data:', err.data);
      }
      if (err && typeof err === 'object' && 'reason' in err) {
        console.error('Error reason:', err.reason);
      }
      if (err && typeof err === 'object' && 'code' in err) {
        console.error('Error code:', err.code);
      }
      console.error('═══════════════════════════════════════════════════════════');
      
      setError(err.message || 'Failed to submit ZK vote');
      setStatus('');
    } finally {
      setIsGeneratingProof(false);
    }
  };

  const handleLoadFromSecret = async () => {
    if (!manualSecret.trim()) {
      setError('Please enter your voter secret');
      return;
    }

    if (!wallet.account) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoadingCredentials(true);
    setError(null);
    setStatus('Generating credentials from secret...');

    try {
      // If we have voter addresses, try to generate credentials
      if (voterAddresses && voterAddresses.length > 0) {
        const data = await getVoterCredentials(voterAddresses, wallet.account);
        if (data && data.secret === manualSecret.trim()) {
          setCurrentVoterData(data);
          setManualSecret('');
          setStatus('✅ Credentials loaded successfully!');
          setTimeout(() => setStatus(''), 3000);
          return;
        } else {
          setError('Secret does not match your address. Please verify your secret with the administrator.');
          return;
        }
      }

      // If no addresses available, we need to regenerate from the secret
      // But we need the addresses to build the tree. For now, show a helpful error.
      setError('Voter addresses not available. Please contact the administrator to get the full voter list, or ask them to regenerate your credentials.');
    } catch (err) {
      console.error('Error loading credentials:', err);
      setError('Failed to load credentials. Please verify your secret is correct.');
    } finally {
      setIsLoadingCredentials(false);
      setStatus('');
    }
  };


  if (!hasVoterData) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#fff3e0',
        borderRadius: '8px',
        border: '1px solid #ff9800'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
          ⚠️ Voter credentials not found
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          To vote, you need your voter secret. This was generated when the proposal was created.
        </p>
        
        {isLoadingCredentials && (
          <p style={{ color: '#1976D2', marginBottom: '10px' }}>Verifying secret...</p>
        )}

        {wallet.account ? (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
              Enter your voter secret:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={manualSecret}
                onChange={(e) => setManualSecret(e.target.value)}
                placeholder="Your voter secret (provided by administrator)"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleLoadFromSecret}
                disabled={isLoadingCredentials || !manualSecret.trim() || !voterAddresses || voterAddresses.length === 0}
                style={{
                  padding: '8px 16px',
                  backgroundColor: (isLoadingCredentials || !manualSecret.trim() || !voterAddresses || voterAddresses.length === 0) ? '#ccc' : '#1976D2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (isLoadingCredentials || !manualSecret.trim() || !voterAddresses || voterAddresses.length === 0) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  minWidth: '120px'
                }}
                title={
                  !voterAddresses || voterAddresses.length === 0
                    ? 'Voter addresses not loaded. Please refresh the page.'
                    : !manualSecret.trim()
                    ? 'Please enter your voter secret'
                    : isLoadingCredentials
                    ? 'Verifying...'
                    : 'Click to verify and load credentials'
                }
              >
                {isLoadingCredentials ? 'Verifying...' : 'Verify & Load'}
              </button>
            </div>
            {(!voterAddresses || voterAddresses.length === 0) && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '12px', color: '#f44336', marginBottom: '5px' }}>
                  ⚠️ Voter addresses not loaded. The button will be enabled once addresses are available.
                </p>
                <p style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                  Tip: Voter addresses are stored when the proposal is created. If this is a new proposal, try refreshing the page.
                </p>
              </div>
            )}
            {voterAddresses && voterAddresses.length > 0 && !manualSecret.trim() && (
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                💡 Enter your secret above to verify and load your credentials.
              </p>
            )}
            {voterAddresses && voterAddresses.length > 0 && manualSecret.trim() && (
              <p style={{ fontSize: '12px', color: '#4CAF50', marginTop: '5px' }}>
                ✓ Ready to verify. Click the button above.
              </p>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Please connect your wallet to enter your secret.
          </p>
        )}

        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          <p>💡 <strong>How to get your secret:</strong></p>
          <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
            <li>The proposal creator should have provided you with your secret</li>
            <li>It was generated when the proposal was created</li>
            <li>Contact the administrator if you don't have it</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="zk-voting">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">🔐 Anonymous Voting (ZK)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your vote will be anonymous. No one can see which candidate you chose.
        </p>
      </div>

      {error && (
        <div className="error-message mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {status && (
        <div className="status-message mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {status}
        </div>
      )}

      <div className="candidates-list mb-4">
        {candidates.map((candidate, index) => (
          <label
            key={index}
            className={`candidate-option block p-3 mb-2 border rounded cursor-pointer transition ${
              selectedCandidate === index
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="radio"
              name="zk-candidate"
              value={index}
              checked={selectedCandidate === index}
              onChange={() => setSelectedCandidate(index)}
              disabled={isGeneratingProof}
              className="mr-2"
            />
            {candidate}
          </label>
        ))}
      </div>

      <button
        onClick={handleVote}
        disabled={isGeneratingProof || selectedCandidate === null}
        className="vote-button w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isGeneratingProof ? 'Generating Proof...' : 'Submit Anonymous Vote'}
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p>🔒 Privacy: Your vote is cryptographically anonymous</p>
        <p>✓ Verifiable: Your vote can be verified without revealing your choice</p>
        <p>🚫 No Double-Voting: You can only vote once per proposal</p>
      </div>
    </div>
  );
}

