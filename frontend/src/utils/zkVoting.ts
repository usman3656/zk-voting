import { buildPoseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';

export interface ZKVoteInputs {
  proposalId: bigint;
  merkleRoot: bigint;
  nullifier: bigint;
  numCandidates: bigint;
  voterSecret: bigint;
  candidateIndex: bigint;
  pathElements: bigint[];
  pathIndices: number[];
  intermediateHashes: bigint[]; // NEW: All intermediate hashes computed in JavaScript
}

export interface ZKProof {
  proof: {
    pi_a: [string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string];
  };
  publicSignals: string[];
}

/**
 * Generate ZK proof for a vote
 */
export async function generateZKProof(
  inputs: ZKVoteInputs,
  wasmPath: string,
  zkeyPath: string
): Promise<ZKProof> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 ZK PROOF GENERATION');
  console.log('═══════════════════════════════════════════════════════════');
  
  console.log('📥 PROOF GENERATION INPUTS:');
  console.log('  proposalId:', inputs.proposalId.toString());
  console.log('  merkleRoot:', inputs.merkleRoot.toString());
  console.log('  nullifier:', inputs.nullifier.toString());
  console.log('  numCandidates:', inputs.numCandidates.toString());
  console.log('  voterSecret (leaf):', inputs.voterSecret.toString());
  console.log('  candidateIndex:', inputs.candidateIndex.toString());
  console.log('  pathElements count:', inputs.pathElements.length);
  console.log('  pathIndices count:', inputs.pathIndices.length);
  console.log('  pathIndices:', inputs.pathIndices.join(', '));
  console.log('');
  
  console.log('📂 LOADING CIRCUIT FILES:');
  console.log('  WASM path:', wasmPath);
  console.log('  zkey path:', zkeyPath);
  console.log('  Converting inputs to strings for snarkjs...');
  
  const inputStrings = {
    proposalId: inputs.proposalId.toString(),
    merkleRoot: inputs.merkleRoot.toString(),
    nullifier: inputs.nullifier.toString(),
    numCandidates: inputs.numCandidates.toString(),
    voterSecret: inputs.voterSecret.toString(),
    candidateIndex: inputs.candidateIndex.toString(),
    pathElements: inputs.pathElements.map(e => e.toString()),
    pathIndices: inputs.pathIndices.map(i => i.toString()),
    intermediateHashes: inputs.intermediateHashes.map(h => h.toString())
  };
  
  console.log('  Input strings prepared');
  console.log('  pathElements strings count:', inputStrings.pathElements.length);
  console.log('  pathIndices strings count:', inputStrings.pathIndices.length);
  console.log('  intermediateHashes strings count:', inputStrings.intermediateHashes.length);
  console.log('');
  console.log('📋 EXACT INPUTS BEING PASSED TO CIRCUIT:');
  console.log('  proposalId:', inputStrings.proposalId);
  console.log('  merkleRoot:', inputStrings.merkleRoot);
  console.log('  nullifier:', inputStrings.nullifier);
  console.log('  numCandidates:', inputStrings.numCandidates);
  console.log('  voterSecret:', inputStrings.voterSecret);
  console.log('  candidateIndex:', inputStrings.candidateIndex);
  console.log('  pathElements:');
  inputStrings.pathElements.forEach((elem, i) => {
    console.log(`    [${i}]: ${elem}`);
  });
  console.log('  pathIndices:');
  inputStrings.pathIndices.forEach((idx, i) => {
    console.log(`    [${i}]: ${idx}`);
  });
  console.log('  intermediateHashes (computed in JavaScript):');
  inputStrings.intermediateHashes.forEach((hash, i) => {
    console.log(`    [${i}]: ${hash}`);
  });
  console.log('');
  
  console.log('🧮 CALLING groth16.fullProve():');
  console.log('  This will:');
  console.log('    1. Load WASM and zkey files');
  console.log('    2. Calculate witness (validates all constraints)');
  console.log('    3. Generate ZK proof');
  console.log('  This may take 10-30 seconds...');
  console.log('');
  console.log('📋 DETAILED INPUT CHECK:');
  console.log('  proposalId:', inputStrings.proposalId);
  console.log('  merkleRoot:', inputStrings.merkleRoot);
  console.log('  nullifier:', inputStrings.nullifier);
  console.log('  numCandidates:', inputStrings.numCandidates);
  console.log('  voterSecret:', inputStrings.voterSecret);
  console.log('  candidateIndex:', inputStrings.candidateIndex);
  console.log('  pathElements[0]:', inputStrings.pathElements[0]);
  console.log('  pathElements[1]:', inputStrings.pathElements[1]);
  console.log('  pathElements[19]:', inputStrings.pathElements[19]);
  console.log('  pathIndices:', inputStrings.pathIndices.join(', '));
  console.log('');
  
  const startTime = Date.now();
  
  try {
    const { groth16 } = await import('snarkjs');
    
    // Try to get more detailed error information
    console.log('  Attempting witness calculation...');
    console.log('  If this fails, the circuit assertion at line 51 is failing');
    console.log('  This means intermediate[5] !== merkleRoot');
    console.log('');
    
    const { proof, publicSignals } = await groth16.fullProve(
      inputStrings,
      wasmPath,
      zkeyPath
    );
    
    const endTime = Date.now();
    console.log(`  ✅ Proof generated in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    console.log('');
    
    console.log('📊 PROOF RESULTS:');
    console.log('  Proof structure:');
    console.log('    pi_a:', proof.pi_a ? `[${proof.pi_a[0].slice(0, 20)}..., ${proof.pi_a[1].slice(0, 20)}...]` : 'missing');
    console.log('    pi_b:', proof.pi_b ? 'present' : 'missing');
    console.log('    pi_c:', proof.pi_c ? `[${proof.pi_c[0].slice(0, 20)}..., ${proof.pi_c[1].slice(0, 20)}...]` : 'missing');
    console.log('  Public signals count:', publicSignals.length);
    if (publicSignals.length > 0) {
      console.log('  Public signals:');
      publicSignals.forEach((s, i) => {
        console.log(`    [${i}]: ${s}`);
      });
    }
    console.log('═══════════════════════════════════════════════════════════');
    
    return {
      proof: {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b,
        pi_c: proof.pi_c
      },
      publicSignals
    };
  } catch (error) {
    const endTime = Date.now();
    console.error(`  ❌ Proof generation failed after ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ PROOF GENERATION ERROR');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('═══════════════════════════════════════════════════════════');
    throw error;
  }
}

/**
 * Format proof for Solidity contract
 */
export function formatProofForContract(proof: ZKProof): {
  proof: [bigint, bigint, [bigint, bigint], [bigint, bigint], bigint, bigint];
  publicInputs: [bigint, bigint, bigint, bigint];
} {
  // Format proof as [a0, a1, [b00, b01], [b10, b11], c0, c1]
  const a = [BigInt(proof.proof.pi_a[0]), BigInt(proof.proof.pi_a[1])];
  const b = [
    [BigInt(proof.proof.pi_b[0][0]), BigInt(proof.proof.pi_b[0][1])],
    [BigInt(proof.proof.pi_b[1][0]), BigInt(proof.proof.pi_b[1][1])]
  ];
  const c = [BigInt(proof.proof.pi_c[0]), BigInt(proof.proof.pi_c[1])];

  // Format public inputs as [proposalId, merkleRoot, nullifier, numCandidates]
  const publicInputs: [bigint, bigint, bigint, bigint] = [
    BigInt(proof.publicSignals[0]),
    BigInt(proof.publicSignals[1]),
    BigInt(proof.publicSignals[2]),
    BigInt(proof.publicSignals[3])
  ];

  return {
    proof: [a[0], a[1], b[0], b[1], c[0], c[1]] as any,
    publicInputs
  };
}

/**
 * Generate nullifier: hash(voterSecret, proposalId)
 */
export async function generateNullifier(
  voterSecret: bigint,
  proposalId: bigint
): Promise<bigint> {
  const poseidon = await buildPoseidon();
  const hash = poseidon([voterSecret, proposalId]);
  // Poseidon returns Uint8Array, convert to hex string then to bigint
  const hashHex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
  return BigInt('0x' + hashHex);
}

/**
 * Generate vote commitment: hash(candidateIndex, secret)
 */
export async function generateVoteCommitment(
  candidateIndex: number,
  secret: string
): Promise<string> {
  // Use keccak256 for commitment (matches Solidity)
  const { keccak256, concat } = await import('ethers');
  const candidateBytes = new Uint8Array(32);
  candidateBytes[31] = candidateIndex;
  const secretBytes = new TextEncoder().encode(secret);
  const encoded = concat([candidateBytes, secretBytes]);
  return keccak256(encoded);
}

/**
 * Verify ZK proof (client-side verification)
 */
export async function verifyZKProof(
  proof: ZKProof,
  vkeyPath: string
): Promise<boolean> {
  const vkey = await fetch(vkeyPath).then(r => r.json());
  const isValid = await groth16.verify(vkey, proof.publicSignals, proof.proof);
  return isValid;
}

