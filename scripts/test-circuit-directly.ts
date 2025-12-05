import { groth16 } from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function testCircuit() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING CIRCUIT DIRECTLY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const wasmPath = path.join(rootDir, 'circuits', 'build', 'vote_js', 'vote.wasm');
  const zkeyPath = path.join(rootDir, 'circuits', 'build', 'vote_final.zkey');

  if (!fs.existsSync(wasmPath)) {
    console.error('❌ WASM file not found:', wasmPath);
    process.exit(1);
  }
  if (!fs.existsSync(zkeyPath)) {
    console.error('❌ zkey file not found:', zkeyPath);
    process.exit(1);
  }

  // Compute intermediate hashes in JavaScript first
  const circomlibjs = await import('circomlibjs');
  const buildPoseidon = circomlibjs.buildPoseidon;
  const poseidon = await buildPoseidon();
  
  const voterSecret = BigInt("106436363374704150969526701081312741609715690251895948863839545166876746951181");
  const pathElements = [
    BigInt("114508788009000244984601007018412637561153216605602894804425192635955343747595"),
    BigInt("59072778429647102475079414651180362335100584636717911618918519487096416739592"),
    BigInt("95724445461010048170031013165046547870653825341822222981259694836192204757780"),
    BigInt("28265998473100555829403008788465736977534233123273733737453499316320922857238"),
    BigInt("15479415893236143080952054038377646058185865006654954013444914336778077019951")
  ];
  const pathIndices = [1, 0, 0, 0, 0];
  
  // Compute all intermediate hashes in JavaScript
  const intermediateHashes: bigint[] = [voterSecret];
  let current = voterSecret;
  
  for (let i = 0; i < pathElements.length; i++) {
    const pathElement = pathElements[i];
    const pathIndex = pathIndices[i];
    
    let left: bigint;
    let right: bigint;
    
    if (pathIndex === 0) {
      left = current;
      right = pathElement;
    } else {
      left = pathElement;
      right = current;
    }
    
    const hash = poseidon([left, right]);
    const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    current = BigInt('0x' + hashHex);
    intermediateHashes.push(current);
  }
  
  console.log('✅ Computed intermediate hashes in JavaScript:');
  intermediateHashes.forEach((h, i) => {
    console.log(`  intermediate[${i}]: ${h.toString()}`);
  });
  console.log('');
  
  // Test inputs (voter 1) - with intermediate hashes computed in JavaScript
  const inputs = {
    proposalId: "5",
    merkleRoot: "99496512745408516490139955032004839749675221858459902513662127246170423510559",
    nullifier: "109049853765661093972740608382307923359979021351570777483349507137752674349084",
    numCandidates: "2",
    voterSecret: voterSecret.toString(),
    candidateIndex: "0",
    pathElements: pathElements.map(e => e.toString()),
    pathIndices: pathIndices.map(i => i.toString()),
    intermediateHashes: intermediateHashes.map(h => h.toString())
  };

  console.log('📋 INPUTS:');
  console.log('  proposalId:', inputs.proposalId);
  console.log('  merkleRoot:', inputs.merkleRoot);
  console.log('  voterSecret:', inputs.voterSecret);
  console.log('  pathElements:', inputs.pathElements.length);
  console.log('  pathIndices:', inputs.pathIndices.join(', '));
  console.log('');

  console.log('🔄 Attempting to generate proof...');
  try {
    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      wasmPath,
      zkeyPath
    );
    console.log('✅ Proof generated successfully!');
    console.log('  Public signals:', publicSignals.length);
  } catch (error: any) {
    console.error('❌ Proof generation failed');
    console.error('  Error:', error.message);
    if (error.message.includes('Assert Failed')) {
      console.error('');
      console.error('⚠️  The circuit assertion failed at line 54');
      console.error('   This means intermediate[5] !== merkleRoot');
      console.error('   Even though JavaScript Poseidon computes correctly,');
      console.error('   Circom Poseidon is computing differently.');
      console.error('');
      console.error('💡 Possible causes:');
      console.error('   1. Different Poseidon implementations');
      console.error('   2. Field arithmetic differences');
      console.error('   3. Input normalization issues');
    }
    process.exit(1);
  }
}

testCircuit().catch(console.error);

