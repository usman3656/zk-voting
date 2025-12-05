import { buildPoseidon } from 'circomlibjs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { groth16 } from 'snarkjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function testPoseidonCompatibility() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING POSEIDON COMPATIBILITY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Test the exact hash from Level 0
  const poseidon = await buildPoseidon();
  
  const left = BigInt('114508788009000244984601007018412637561153216605602894804425192635955343747595');
  const right = BigInt('106436363374704150969526701081312741609715690251895948863839545166876746951181');
  
  console.log('📋 TEST INPUTS:');
  console.log('  left: ', left.toString());
  console.log('  right:', right.toString());
  console.log('');

  // JavaScript Poseidon
  const jsHash = poseidon([left, right]);
  const jsHashHex = Array.from(jsHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  const jsHashBigInt = BigInt('0x' + jsHashHex);
  
  console.log('🖥️  JavaScript Poseidon (circomlibjs):');
  console.log('  Hash:', jsHashBigInt.toString());
  console.log('  Expected: 82389953321066061825501396545079112546558790571580092880678256174335893944343');
  console.log('  Match:', jsHashBigInt.toString() === '82389953321066061825501396545079112546558790571580092880678256174335893944343' ? '✅ YES' : '❌ NO');
  console.log('');

  // Test with circuit
  console.log('⚙️  Testing with circuit...');
  const wasmPath = path.join(rootDir, 'circuits', 'build', 'vote_js', 'vote.wasm');
  const zkeyPath = path.join(rootDir, 'circuits', 'build', 'vote_final.zkey');

  if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
    console.error('❌ Circuit files not found');
    return;
  }

  // Use the exact inputs that should work
  const inputs = {
    proposalId: "5",
    merkleRoot: "99496512745408516490139955032004839749675221858459902513662127246170423510559",
    nullifier: "109049853765661093972740608382307923359979021351570777483349507137752674349084",
    numCandidates: "2",
    voterSecret: "106436363374704150969526701081312741609715690251895948863839545166876746951181",
    candidateIndex: "0",
    pathElements: [
      "114508788009000244984601007018412637561153216605602894804425192635955343747595",
      "59072778429647102475079414651180362335100584636717911618918519487096416739592",
      "95724445461010048170031013165046547870653825341822222981259694836192204757780",
      "28265998473100555829403008788465736977534233123273733737453499316320922857238",
      "15479415893236143080952054038377646058185865006654954013444914336778077019951"
    ],
    pathIndices: ["1", "0", "0", "0", "0"]
  };

  try {
    const { proof, publicSignals } = await groth16.fullProve(
      inputs,
      wasmPath,
      zkeyPath
    );
    console.log('✅ Circuit proof generated successfully!');
    console.log('   This means Circom Poseidon matches JavaScript Poseidon');
  } catch (error: any) {
    console.error('❌ Circuit proof generation failed');
    console.error('   Error:', error.message);
    console.error('');
    console.error('💡 This confirms that Circom Poseidon computes differently');
    console.error('   than JavaScript Poseidon (circomlibjs).');
    console.error('');
    console.error('🔧 Possible solutions:');
    console.error('   1. Update circomlib and circomlibjs to compatible versions');
    console.error('   2. Use a different Poseidon implementation');
    console.error('   3. Check if there\'s a field arithmetic issue');
  }
}

testPoseidonCompatibility().catch(console.error);

