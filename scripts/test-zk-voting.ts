import { buildPoseidon } from 'circomlibjs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test script to debug ZK voting Merkle root computation
 * This will help identify why the circuit assertion is failing
 */

const CIRCUIT_LEVELS = 5;

async function testMerkleComputation() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 ZK VOTING DEBUG TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const poseidon = await buildPoseidon();

  // Test with 2 voters (same as user's case)
  const addresses = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  ];

  console.log('📋 TEST SETUP:');
  console.log('  Voters:', addresses.length);
  addresses.forEach((addr, i) => console.log(`    [${i}]: ${addr}`));
  console.log('');

  // Step 1: Generate secrets and leaves (same as frontend)
  console.log('🔐 STEP 1: Generating secrets and leaves');
  const secrets: Record<string, string> = {};
  const leaves: bigint[] = [];

  for (const address of addresses) {
    const addressClean = address.startsWith('0x') ? address.slice(2) : address;
    const addressNum = BigInt('0x' + addressClean);
    const secretHash = poseidon([addressNum]);
    const secretHashHex = Array.from(secretHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    const secret = BigInt('0x' + secretHashHex).toString();
    secrets[address.toLowerCase()] = secret;

    // Hash the secret to create the leaf
    const leafHash = poseidon([BigInt(secret)]);
    const leafHashHex = Array.from(leafHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    const leaf = BigInt('0x' + leafHashHex);
    leaves.push(leaf);

    console.log(`  ${address}:`);
    console.log(`    secret: ${secret}`);
    console.log(`    leaf: ${leaf.toString()}`);
  }
  console.log('');

  // Step 2: Build Merkle tree
  console.log('🌳 STEP 2: Building Merkle tree');
  const tree: bigint[][] = [leaves];
  let currentLevel = leaves;

  while (currentLevel.length > 1) {
    const nextLevel: bigint[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const hash = poseidon([currentLevel[i], currentLevel[i + 1]]);
        const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        nextLevel.push(BigInt('0x' + hashHex));
      } else {
        const hash = poseidon([currentLevel[i], currentLevel[i]]);
        const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        nextLevel.push(BigInt('0x' + hashHex));
      }
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  const originalRoot = tree[tree.length - 1][0];
  const actualDepth = tree.length - 1;

  console.log(`  Tree depth: ${actualDepth} levels`);
  console.log(`  Original root: ${originalRoot.toString()}`);
  console.log('');

  // Step 3: Compute extended root (as done in generateMerkleTree)
  // CRITICAL: The circuit pads with pathIndex=0, which means hash(current, originalRoot)
  // NOT hash(root, root)! We must compute it the same way the circuit does.
  console.log('🔧 STEP 3: Computing extended root (as stored on-chain)');
  let extCurrent = leaves[0];
  
  // Hash through actual tree levels first
  let extIndex = 0;
  let extLevel = 0;
  while (extLevel < actualDepth) {
    const siblingIndex = extIndex % 2 === 0 ? extIndex + 1 : extIndex - 1;
    const sibling = siblingIndex < tree[extLevel].length 
      ? tree[extLevel][siblingIndex]
      : tree[extLevel][extIndex];
    
    const pathIndex = extIndex % 2;
    let left: bigint, right: bigint;
    if (pathIndex === 0) {
      left = extCurrent;
      right = sibling;
    } else {
      left = sibling;
      right = extCurrent;
    }
    
    const hash = poseidon([left, right]);
    const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    extCurrent = BigInt('0x' + hashHex);
    
    extIndex = Math.floor(extIndex / 2);
    extLevel++;
  }
  
  // Now pad to 5 levels using originalRoot as pathElement with pathIndex=0
  for (let i = actualDepth; i < CIRCUIT_LEVELS; i++) {
    const hash = poseidon([extCurrent, originalRoot]);
    const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    extCurrent = BigInt('0x' + hashHex);
    console.log(`  Padding level ${i}: hash(intermediate, originalRoot) = ${extCurrent.toString().slice(0, 30)}...`);
  }
  
  const extendedRoot = extCurrent;
  console.log(`  Extended root (stored on-chain): ${extendedRoot.toString()}`);
  console.log('');

  // Step 4: Generate proof for voter 0 (as done in getMerkleProof)
  console.log('📝 STEP 4: Generating proof for voter 0');
  const leafIndex = 0;
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];

  let currentIndex = leafIndex;
  let currentLevelIndex = 0;

  // Traverse actual tree
  while (currentLevelIndex < tree.length - 1) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    const sibling = siblingIndex < tree[currentLevelIndex].length 
      ? tree[currentLevelIndex][siblingIndex]
      : tree[currentLevelIndex][currentIndex];
    
    pathElements.push(sibling);
    pathIndices.push(currentIndex % 2);
    
    console.log(`  Level ${currentLevelIndex}: index=${currentIndex}, sibling=${sibling.toString().slice(0, 30)}..., pathIndex=${currentIndex % 2}`);
    
    currentIndex = Math.floor(currentIndex / 2);
    currentLevelIndex++;
  }

  // Pad to 5 levels
  console.log(`  Padding ${CIRCUIT_LEVELS - pathElements.length} levels...`);
  for (let i = actualDepth; i < CIRCUIT_LEVELS; i++) {
    pathElements.push(originalRoot);
    pathIndices.push(0);
    console.log(`  Padding level ${i}: pathElement=${originalRoot.toString().slice(0, 30)}..., pathIndex=0`);
  }
  console.log('');

  // Step 5: Compute what the circuit will compute
  console.log('⚙️ STEP 5: Computing circuit computation (manual)');
  let circuitIntermediate = leaves[0]; // Start from leaf
  console.log(`  intermediate[0] = ${circuitIntermediate.toString()}`);

  for (let i = 0; i < CIRCUIT_LEVELS; i++) {
    const pathElement = pathElements[i];
    const pathIndex = pathIndices[i];

    // Circuit logic: mux0 and mux1
    let left: bigint, right: bigint;
    if (pathIndex === 0) {
      left = circuitIntermediate;
      right = pathElement;
    } else {
      left = pathElement;
      right = circuitIntermediate;
    }

    const hash = poseidon([left, right]);
    const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    circuitIntermediate = BigInt('0x' + hashHex);

    console.log(`  Level ${i}: pathIndex=${pathIndex}, hash(${left.toString().slice(0, 20)}..., ${right.toString().slice(0, 20)}...) = ${circuitIntermediate.toString().slice(0, 30)}...`);
    console.log(`    intermediate[${i + 1}] = ${circuitIntermediate.toString()}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESULTS:');
  console.log('  Extended root (stored):', extendedRoot.toString());
  console.log('  Circuit computed:      ', circuitIntermediate.toString());
  console.log('  Match:', extendedRoot === circuitIntermediate ? '✅ YES' : '❌ NO');
  if (extendedRoot !== circuitIntermediate) {
    console.log('  Difference:', (extendedRoot > circuitIntermediate ? extendedRoot - circuitIntermediate : circuitIntermediate - extendedRoot).toString());
  }
  console.log('═══════════════════════════════════════════════════════════');

  // Step 6: Try the other approach - hash(current, originalRoot) for padding
  console.log('');
  console.log('🔄 STEP 6: Testing alternative padding (hash(current, originalRoot))');
  let altIntermediate = leaves[0];
  
  // Hash through actual tree
  currentIndex = 0;
  currentLevelIndex = 0;
  while (currentLevelIndex < actualDepth) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    const sibling = siblingIndex < tree[currentLevelIndex].length 
      ? tree[currentLevelIndex][siblingIndex]
      : tree[currentLevelIndex][currentIndex];
    
    const pathIndex = currentIndex % 2;
    let left: bigint, right: bigint;
    if (pathIndex === 0) {
      left = altIntermediate;
      right = sibling;
    } else {
      left = sibling;
      right = altIntermediate;
    }
    
    const hash = poseidon([left, right]);
    const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    altIntermediate = BigInt('0x' + hashHex);
    
    currentIndex = Math.floor(currentIndex / 2);
    currentLevelIndex++;
  }

  console.log(`  After tree: ${altIntermediate.toString()}`);
  console.log(`  Should equal original root: ${originalRoot.toString()}`);
  console.log(`  Match: ${altIntermediate === originalRoot ? '✅' : '❌'}`);

  // Now pad with hash(current, originalRoot)
  for (let i = actualDepth; i < CIRCUIT_LEVELS; i++) {
    const hash = poseidon([altIntermediate, originalRoot]);
    const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    altIntermediate = BigInt('0x' + hashHex);
    console.log(`  Padding level ${i}: hash(intermediate, originalRoot) = ${altIntermediate.toString().slice(0, 30)}...`);
  }

  console.log('');
  console.log('  Alternative result:', altIntermediate.toString());
  console.log('  Extended root (stored):', extendedRoot.toString());
  console.log('  Match:', altIntermediate === extendedRoot ? '✅ YES' : '❌ NO');
  console.log('═══════════════════════════════════════════════════════════');
}

// Run the test
testMerkleComputation().catch(console.error);

