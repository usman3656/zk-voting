import { buildPoseidon } from 'circomlibjs';

/**
 * Verify what root a proposal should have based on addresses
 * This helps identify if a proposal was created with old or new code
 */

const CIRCUIT_LEVELS = 5;
const MAX_LEAVES = 2 ** CIRCUIT_LEVELS; // 32 leaves

async function verifyProposalRoot(addresses: string[], storedRoot: string) {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 VERIFYING PROPOSAL ROOT');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const poseidon = await buildPoseidon();

  console.log('📋 INPUT:');
  console.log(`  Addresses: ${addresses.length}`);
  addresses.forEach((addr, i) => console.log(`    [${i}]: ${addr}`));
  console.log(`  Stored root (from contract): ${storedRoot}`);
  console.log(`  Stored root (decimal): ${BigInt(storedRoot).toString()}`);
  console.log('');

  // Compute what the root SHOULD be with current code (depth 5)
  const secrets: Record<string, string> = {};
  const leaves: bigint[] = [];

  console.log('🔐 Computing secrets and leaves (current code method):');
  for (const address of addresses) {
    const addressClean = address.startsWith('0x') ? address.slice(2) : address;
    const addressNum = BigInt('0x' + addressClean);
    const secretHash = poseidon([addressNum]);
    const secretHashHex = Array.from(secretHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    const secret = BigInt('0x' + secretHashHex).toString();
    secrets[address.toLowerCase()] = secret;

    const leafHash = poseidon([BigInt(secret)]);
    const leafHashHex = Array.from(leafHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    const leaf = BigInt('0x' + leafHashHex);
    leaves.push(leaf);
  }

  // Pad to 32 leaves
  const zeroLeaf = 0n;
  while (leaves.length < MAX_LEAVES) {
    leaves.push(zeroLeaf);
  }

  console.log(`  Generated ${leaves.length} leaves (${addresses.length} real + ${leaves.length - addresses.length} zeros)`);
  console.log('');

  // Build tree
  console.log('🌳 Building Merkle tree (depth 5, 32 leaves):');
  const tree: bigint[][] = [leaves];
  let currentLevel = leaves;
  let levelIndex = 0;

  while (currentLevel.length > 1) {
    const nextLevel: bigint[] = [];
    levelIndex++;

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

  const computedRoot = tree[tree.length - 1][0];
  const computedRootHex = '0x' + computedRoot.toString(16).padStart(64, '0');
  const actualDepth = tree.length - 1;

  console.log(`  Tree depth: ${actualDepth} levels`);
  console.log(`  Computed root: ${computedRootHex}`);
  console.log(`  Computed root (decimal): ${computedRoot.toString()}`);
  console.log('');

  // Compare
  const storedRootBigInt = BigInt(storedRoot);
  const matches = computedRoot === storedRootBigInt;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 VERIFICATION RESULT:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Stored root:    ${storedRootBigInt.toString()}`);
  console.log(`  Computed root:  ${computedRoot.toString()}`);
  console.log(`  Match: ${matches ? '✅ YES' : '❌ NO'}`);
  console.log('');

  if (matches) {
    console.log('✅ SUCCESS: The proposal was created with CURRENT code (depth 5)');
    console.log('   The root matches what the current code computes.');
  } else {
    console.log('❌ MISMATCH: The proposal was created with OLD code');
    console.log('   The stored root does NOT match what current code computes.');
    console.log('   This means:');
    console.log('   - The proposal was created before the depth 5 fix');
    console.log('   - You need to create a NEW proposal with the updated code');
    console.log(`   - Difference: ${(computedRoot > storedRootBigInt ? computedRoot - storedRootBigInt : storedRootBigInt - computedRoot).toString()}`);
  }
  console.log('═══════════════════════════════════════════════════════════');
}

// Get addresses and root from command line
const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: npm run zk:verify-root <address1> <address2> <storedRoot>');
  console.error('Example: npm run zk:verify-root 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 0x...');
  process.exit(1);
}

const addresses = args.slice(0, -1);
const storedRoot = args[args.length - 1];

verifyProposalRoot(addresses, storedRoot).catch(console.error);

