import { buildPoseidon } from 'circomlibjs';

/**
 * Debug function to manually compute the Merkle path and verify it matches the circuit
 */
export async function debugMerklePath(
  leaf: bigint,
  pathElements: bigint[],
  pathIndices: number[],
  expectedRoot: bigint
): Promise<{ computed: bigint; expected: bigint; matches: boolean; steps: bigint[] }> {
  const poseidon = await buildPoseidon();
  const steps: bigint[] = [leaf];
  let current = leaf;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 DETAILED MERKLE PATH DEBUG');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📌 INPUTS:');
  console.log('  Leaf (voterSecret):', leaf.toString());
  console.log('  Expected Root (merkleRoot):', expectedRoot.toString());
  console.log('  PathElements count:', pathElements.length);
  console.log('  PathIndices count:', pathIndices.length);
  console.log('');
  console.log('📋 PathElements (first 5 and last 5):');
  for (let i = 0; i < Math.min(5, pathElements.length); i++) {
    console.log(`    [${i}]: ${pathElements[i].toString()}`);
  }
  if (pathElements.length > 10) {
    console.log('    ...');
    for (let i = pathElements.length - 5; i < pathElements.length; i++) {
      console.log(`    [${i}]: ${pathElements[i].toString()}`);
    }
  }
  console.log('');
  console.log('📋 PathIndices:', pathIndices.join(', '));
  console.log('');
  console.log('🔄 COMPUTATION STEPS:');
  
  for (let i = 0; i < pathElements.length; i++) {
    const pathElement = pathElements[i];
    const pathIndex = pathIndices[i];
    
    // Circuit logic: mux0 and mux1 select based on pathIndices[i]
    // If pathIndices[i] == 0: hash(current, pathElement)
    // If pathIndices[i] == 1: hash(pathElement, current)
    let left: bigint;
    let right: bigint;
    
    if (pathIndex === 0) {
      left = current;
      right = pathElement;
    } else {
      left = pathElement;
      right = current;
    }
    
    // Note: circomlibjs Poseidon automatically handles field arithmetic
    // The Poseidon prime is: 21888242871839275222246405745257275088548364400416034343698204186575808495617
    // circomlibjs handles normalization automatically, so we pass bigints directly
    // DO NOT normalize manually - circomlibjs will handle it internally
    
    const hash = poseidon([left, right]);
    const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    current = BigInt('0x' + hashHex);
    steps.push(current);
    
    console.log(`  Level ${i}:`);
    console.log(`    pathIndex: ${pathIndex} (${pathIndex === 0 ? 'left=current, right=pathElement' : 'left=pathElement, right=current'})`);
    console.log(`    left:  ${left.toString()}`);
    console.log(`    right: ${right.toString()}`);
    console.log(`    hash(left, right) = ${current.toString()}`);
    console.log(`    intermediate[${i + 1}] = ${current.toString()}`);
    if (i === pathElements.length - 1) {
      console.log(`    ⚠️ This is the FINAL intermediate[${i + 1}] that should equal merkleRoot`);
      console.log(`    Expected: ${expectedRoot.toString()}`);
      console.log(`    Computed: ${current.toString()}`);
      console.log(`    Match: ${current === expectedRoot ? '✅ YES' : '❌ NO'}`);
    }
    console.log('');
  }
  
  const matches = current === expectedRoot;
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESULTS:');
  console.log('  Final computed root:', current.toString());
  console.log('  Expected root:      ', expectedRoot.toString());
  console.log('  Match:', matches ? '✅ YES' : '❌ NO');
  if (!matches) {
    console.log('  Difference:', (current > expectedRoot ? current - expectedRoot : expectedRoot - current).toString());
  }
  console.log('═══════════════════════════════════════════════════════════');
  
  return { computed: current, expected: expectedRoot, matches, steps };
}

