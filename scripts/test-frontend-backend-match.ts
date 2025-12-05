import { buildPoseidon } from 'circomlibjs';

/**
 * COMPREHENSIVE TEST: Frontend vs Backend Merkle Tree Computation
 * This script replicates EXACTLY what the frontend does and verifies it matches the circuit
 */

const CIRCUIT_LEVELS = 5;
const MAX_LEAVES = 2 ** CIRCUIT_LEVELS; // 32 leaves

async function testFrontendBackendMatch() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 FRONTEND vs BACKEND MERKLE TREE MATCH TEST');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const poseidon = await buildPoseidon();

  // Test addresses (EXACT addresses from user)
  const addresses = [
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  ];

  console.log('📋 INPUT:');
  console.log(`  Addresses: ${addresses.length}`);
  addresses.forEach((addr, i) => console.log(`    [${i}]: ${addr}`));
  console.log(`  Circuit depth: ${CIRCUIT_LEVELS} levels`);
  console.log(`  Max leaves: ${MAX_LEAVES}`);
  console.log('');

  // ============================================
  // STEP 1: FRONTEND COMPUTATION (exact replica)
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🖥️  FRONTEND COMPUTATION (what frontend does)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const secrets: Record<string, string> = {};
  const leaves: bigint[] = [];

  // Generate secrets and leaves (EXACT frontend logic)
  console.log('STEP 1.1: Generating secrets and leaves');
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const addressClean = address.startsWith('0x') ? address.slice(2) : address;
    const addressNum = BigInt('0x' + addressClean);
    
    console.log(`  Address [${i}]: ${address}`);
    console.log(`    Clean address: ${addressClean}`);
    console.log(`    Address as BigInt: ${addressNum.toString()}`);
    
    const secretHash = poseidon([addressNum]);
    const secretHashHex = Array.from(secretHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    const secret = BigInt('0x' + secretHashHex).toString();
    secrets[address.toLowerCase()] = secret;

    console.log(`    Secret hash (raw): ${Array.from(secretHash as unknown as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`    Secret: ${secret}`);
    console.log(`    Secret as BigInt: ${BigInt(secret).toString()}`);

    // Hash the secret to create the leaf
    const leafHash = poseidon([BigInt(secret)]);
    const leafHashHex = Array.from(leafHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    const leaf = BigInt('0x' + leafHashHex);
    leaves.push(leaf);

    console.log(`    Leaf hash (raw): ${Array.from(leafHash as unknown as Uint8Array).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`    Leaf: ${leaf.toString()}`);
    console.log('');
  }

  // Pad leaves to exactly 32
  console.log('STEP 1.2: Padding leaves to exactly 32');
  const zeroLeaf = 0n;
  const originalCount = leaves.length;
  while (leaves.length < MAX_LEAVES) {
    leaves.push(zeroLeaf);
  }
  console.log(`  Original: ${originalCount} leaves`);
  console.log(`  After padding: ${leaves.length} leaves`);
  console.log('');

  // Build Merkle tree (EXACT frontend logic)
  console.log('STEP 1.3: Building Merkle tree (frontend method)');
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
      } else {
        const node = currentLevel[i];
        const hash = poseidon([node, node]);
        const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        const hashValue = BigInt('0x' + hashHex);
        nextLevel.push(hashValue);
      }
    }

    console.log(`  Level ${levelIndex}: ${nextLevel.length} nodes computed`);
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  const frontendRoot = tree[tree.length - 1][0];
  const frontendDepth = tree.length - 1;

  console.log(`  Final root at level ${frontendDepth}: ${frontendRoot.toString()}`);
  console.log(`  Frontend tree depth: ${frontendDepth} levels`);
  console.log('');

  // Generate proof for voter 1 (EXACT frontend logic)
  // User is voting as voter 1 (second address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
  console.log('STEP 1.4: Generating Merkle proof for voter 1 (frontend method)');
  console.log(`  Voter 0 address: ${addresses[0]}`);
  console.log(`  Voter 1 address: ${addresses[1]} (YOU ARE VOTING AS THIS)`);
  console.log(`  Voter 1 leaf index: 1`);
  const leafIndex = 1; // Voter 1 is at index 1
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
    console.log(`    Path index: ${pathIndex}`);
    console.log(`    Current: ${tree[currentLevelIndex][currentIndex].toString().slice(0, 20)}...`);
    console.log(`    Sibling: ${sibling.toString().slice(0, 20)}...`);

    currentIndex = Math.floor(currentIndex / 2);
    currentLevelIndex++;
  }

  console.log(`  Generated ${pathElements.length} path elements`);
  console.log(`  Path indices: [${pathIndices.join(', ')}]`);
  console.log('');

  // ============================================
  // STEP 2: BACKEND/CIRCUIT COMPUTATION
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('⚙️  BACKEND/CIRCUIT COMPUTATION (what circuit does)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Get the leaf value (voterSecret)
  const voterSecret = tree[0][leafIndex];
  console.log('STEP 2.1: Starting from leaf (voterSecret)');
  console.log(`  voterSecret (leaf): ${voterSecret.toString()}`);
  console.log('');

  // Circuit computation: hash through exactly 5 levels
  console.log('STEP 2.2: Circuit computation (5 levels)');
  let circuitIntermediate = voterSecret;
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

    console.log(`  Level ${i}:`);
    console.log(`    pathIndex: ${pathIndex} (${pathIndex === 0 ? 'left=current, right=pathElement' : 'left=pathElement, right=current'})`);
    console.log(`    left:  ${left.toString()}`);
    console.log(`    right: ${right.toString()}`);
    console.log(`    hash(left, right) = ${circuitIntermediate.toString()}`);
    console.log(`    intermediate[${i + 1}] = ${circuitIntermediate.toString()}`);
  }

  const circuitRoot = circuitIntermediate;
  console.log('');

  // ============================================
  // STEP 3: VERIFICATION
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  console.log('📊 COMPARISON:');
  console.log(`  Frontend root (stored): ${frontendRoot.toString()}`);
  console.log(`  Circuit root (computed): ${circuitRoot.toString()}`);
  console.log(`  Match: ${frontendRoot === circuitRoot ? '✅ YES' : '❌ NO'}`);
  console.log('');

  console.log('📏 TREE STRUCTURE:');
  console.log(`  Frontend depth: ${frontendDepth} levels`);
  console.log(`  Circuit expects: ${CIRCUIT_LEVELS} levels`);
  console.log(`  Match: ${frontendDepth === CIRCUIT_LEVELS ? '✅ YES' : '❌ NO'}`);
  console.log('');

  console.log('📝 PROOF STRUCTURE:');
  console.log(`  Path elements: ${pathElements.length}`);
  console.log(`  Path indices: ${pathIndices.length}`);
  console.log(`  Expected: ${CIRCUIT_LEVELS}`);
  console.log(`  Match: ${pathElements.length === CIRCUIT_LEVELS ? '✅ YES' : '❌ NO'}`);
  console.log('');

  if (frontendRoot === circuitRoot && frontendDepth === CIRCUIT_LEVELS) {
    console.log('🎉 SUCCESS: Frontend and Backend computations match!');
    console.log('   The Merkle tree is built correctly and matches circuit expectations.');
  } else {
    console.log('❌ FAILURE: Mismatch detected!');
    if (frontendRoot !== circuitRoot) {
      console.log(`   Root mismatch: ${(frontendRoot > circuitRoot ? frontendRoot - circuitRoot : circuitRoot - frontendRoot).toString()}`);
    }
    if (frontendDepth !== CIRCUIT_LEVELS) {
      console.log(`   Depth mismatch: frontend=${frontendDepth}, expected=${CIRCUIT_LEVELS}`);
    }
  }
  console.log('═══════════════════════════════════════════════════════════');
}

// Run the test
testFrontendBackendMatch().catch(console.error);

