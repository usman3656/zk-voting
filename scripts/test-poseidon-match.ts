import { buildPoseidon } from 'circomlibjs';
import { groth16 } from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function testPoseidonMatch() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING POSEIDON HASH MATCH');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const poseidon = await buildPoseidon();
  
  // Test the exact values from Level 0
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

  // Test with simple circuit
  const wasmPath = path.join(rootDir, 'circuits', 'build', 'test_js', 'test-poseidon-simple.wasm');
  
  if (!fs.existsSync(wasmPath)) {
    console.error('❌ Test WASM not found. Please compile test-poseidon-simple.circom first.');
    return;
  }

  console.log('⚙️  Testing with simple circuit...');
  const inputs = {
    left: left.toString(),
    right: right.toString()
  };

  try {
    // Just calculate witness to see what hash the circuit produces
    const { calculateWitness } = await import('snarkjs');
    const wtns = await calculateWitness(inputs, wasmPath);
    
    // The hash should be in the witness at some index
    // For a simple circuit, the output is usually at index 1 (after input signals)
    console.log('  Circuit witness calculated');
    console.log('  Witness length:', wtns.length);
    console.log('  Output (hash):', wtns[1]?.toString());
    console.log('  JavaScript hash:', jsHashBigInt.toString());
    console.log('  Match:', wtns[1]?.toString() === jsHashBigInt.toString() ? '✅ YES' : '❌ NO');
    
    if (wtns[1]?.toString() !== jsHashBigInt.toString()) {
      console.error('');
      console.error('❌ CONFIRMED: Circom Poseidon produces different hash than JavaScript Poseidon');
      console.error('   This is the root cause of the issue.');
      console.error('   The circuit and JavaScript are using incompatible Poseidon implementations.');
    }
  } catch (error: any) {
    console.error('❌ Failed to calculate witness:', error.message);
  }
}

testPoseidonMatch().catch(console.error);

