import { buildPoseidon } from 'circomlibjs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Test script to verify Merkle tree computation matches between frontend and circuit
 * This simulates what the frontend does and what the circuit expects
 */
async function testMerkleTree() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 MERKLE TREE COMPUTATION TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const poseidon = await buildPoseidon();
  const CIRCUIT_LEVELS = 5;
  const MAX_LEAVES = 2 ** CIRCUIT_LEVELS; // 32 leaves

  // Test with 2 voters (same as user's case)
  const addresses = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  ];

  console.log('📋 TEST SETUP:');
  console.log(`  Voters: ${addresses.length}`);
  console.log(`  Circuit depth: ${CIRCUIT_LEVELS} levels`);
  console.log(`  Max leaves: ${MAX_LEAVES}`);
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

  // Step 2: Pad leaves to exactly 32
  console.log('🔧 STEP 2: Padding leaves to exactly 32');
  const zeroLeaf = 0n;
  const originalLeafCount = leaves.length;
  while (leaves.length < MAX_LEAVES) {
    leaves.push(zeroLeaf);
  }
  console.log(`  Original leaves: ${originalLeafCount}`);
  console.log(`  After padding: ${leaves.length} leaves (${originalLeafCount} real + ${leaves.length - originalLeafCount} zeros)`);
  console.log('');

  // Step 3: Build Merkle tree level by level
  console.log('🌳 STEP 3: Building Merkle tree level by level');
  const tree: bigint[][] = [leaves];
  let currentLevel = leaves;
  let levelIndex = 0;

  console.log(`  Level ${levelIndex}: ${currentLevel.length} nodes (leaves)`);

  while (currentLevel.length > 1) {
    const nextLevel: bigint[] = [];
    levelIndex++;

    console.log(`  Level ${levelIndex}: Computing ${Math.ceil(currentLevel.length / 2)} nodes from ${currentLevel.length} parent nodes`);

    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        const hash = poseidon([left, right]);
        const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        const hashValue = BigInt('0x' + hashHex);
        nextLevel.push(hashValue);

        console.log(`    [${i}, ${i + 1}]: hash(${left.toString().slice(0, 20)}..., ${right.toString().slice(0, 20)}...) = ${hashValue.toString().slice(0, 20)}...`);
      } else {
        const node = currentLevel[i];
        const hash = poseidon([node, node]);
        const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        const hashValue = BigInt('0x' + hashHex);
        nextLevel.push(hashValue);

        console.log(`    [${i}]: hash(${node.toString().slice(0, 20)}..., ${node.toString().slice(0, 20)}...) = ${hashValue.toString().slice(0, 20)}... (self-hash)`);
      }
    }

    console.log(`  Level ${levelIndex}: ${nextLevel.length} nodes computed`);
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  const root = tree[tree.length - 1][0];
  const actualDepth = tree.length - 1;

  console.log(`  Final root at level ${levelIndex}: ${root.toString()}`);
  console.log(`  Tree depth: ${actualDepth} levels`);
  console.log(`  Expected depth: ${CIRCUIT_LEVELS} levels`);
  console.log(`  Match: ${actualDepth === CIRCUIT_LEVELS ? '✅ YES' : '❌ NO'}`);
  console.log('');

  // Step 4: Generate proof for voter 0
  console.log('📝 STEP 4: Generating Merkle proof for voter 0');
  const leafIndex = 0;
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];

  let currentIndex = leafIndex;
  let currentLevelIndex = 0;

  console.log(`  Leaf index: ${leafIndex}`);
  console.log(`  Starting from level 0, leaf value: ${tree[0][leafIndex].toString().slice(0, 20)}...`);
  console.log('');

  while (currentLevelIndex < CIRCUIT_LEVELS && currentLevelIndex < tree.length - 1) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    const sibling = siblingIndex < tree[currentLevelIndex].length 
      ? tree[currentLevelIndex][siblingIndex]
      : tree[currentLevelIndex][currentIndex];

    const pathIndex = currentIndex % 2;
    pathElements.push(sibling);
    pathIndices.push(pathIndex);

    console.log(`  Level ${currentLevelIndex}:`);
    console.log(`    Current index: ${currentIndex}`);
    console.log(`    Sibling index: ${siblingIndex}`);
    console.log(`    Path index: ${pathIndex} (${pathIndex === 0 ? 'left=current, right=sibling' : 'left=sibling, right=current'})`);
    console.log(`    Current value: ${tree[currentLevelIndex][currentIndex].toString().slice(0, 20)}...`);
    console.log(`    Sibling value: ${sibling.toString().slice(0, 20)}...`);

    currentIndex = Math.floor(currentIndex / 2);
    currentLevelIndex++;
  }

  console.log(`  Generated ${pathElements.length} path elements`);
  console.log(`  Path indices: [${pathIndices.join(', ')}]`);
  console.log('');

  // Step 5: Verify proof by computing root manually
  console.log('🔍 STEP 5: Verifying proof by computing root manually');
  let computedRoot = tree[0][leafIndex]; // Start from leaf
  console.log(`  Starting from leaf: ${computedRoot.toString().slice(0, 20)}...`);

  for (let i = 0; i < pathElements.length; i++) {
    const pathElement = pathElements[i];
    const pathIndex = pathIndices[i];

    let left: bigint, right: bigint;
    if (pathIndex === 0) {
      left = computedRoot;
      right = pathElement;
    } else {
      left = pathElement;
      right = computedRoot;
    }

    const hash = poseidon([left, right]);
    const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    computedRoot = BigInt('0x' + hashHex);

    console.log(`  Level ${i}:`);
    console.log(`    pathIndex: ${pathIndex} (${pathIndex === 0 ? 'left=current, right=pathElement' : 'left=pathElement, right=current'})`);
    console.log(`    left:  ${left.toString().slice(0, 20)}...`);
    console.log(`    right: ${right.toString().slice(0, 20)}...`);
    console.log(`    hash(left, right) = ${computedRoot.toString().slice(0, 20)}...`);
    console.log(`    intermediate[${i + 1}] = ${computedRoot.toString()}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESULTS:');
  console.log(`  Tree root (stored): ${root.toString()}`);
  console.log(`  Computed root:      ${computedRoot.toString()}`);
  console.log(`  Match: ${root === computedRoot ? '✅ YES' : '❌ NO'}`);
  if (root !== computedRoot) {
    console.log(`  Difference: ${(root > computedRoot ? root - computedRoot : computedRoot - root).toString()}`);
  }
  console.log(`  Tree depth: ${actualDepth} (expected: ${CIRCUIT_LEVELS})`);
  console.log(`  Path elements: ${pathElements.length} (expected: ${CIRCUIT_LEVELS})`);
  console.log('═══════════════════════════════════════════════════════════');
}

// Run the test
testMerkleTree().catch(console.error);

