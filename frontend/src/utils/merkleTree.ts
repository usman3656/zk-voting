import { buildPoseidon } from 'circomlibjs';

/**
 * Generate a Merkle tree for eligible voters
 * ALWAYS builds a full 5-level tree by padding leaves with zeros
 * This eliminates the need for padding logic in proof generation
 */
export async function generateMerkleTree(
  addresses: string[]
): Promise<{ root: string; secrets: Record<string, string>; tree: bigint[][] }> {
  if (!addresses || addresses.length === 0) {
    throw new Error('At least one voter address is required');
  }
  const poseidon = await buildPoseidon();
  const secrets: Record<string, string> = {};
  const CIRCUIT_LEVELS = 5;
  const MAX_LEAVES = 2 ** CIRCUIT_LEVELS; // 2^5 = 32 leaves
  
  // Generate secrets deterministically from address (same as backend)
  const leaves: bigint[] = [];
  
  for (const address of addresses) {
    // Generate secret deterministically: hash(address) - same as backend script
    const addressClean = address.startsWith('0x') ? address.slice(2) : address;
    const addressNum = BigInt('0x' + addressClean);
    const secretHash = poseidon([addressNum]);
    // Convert Uint8Array to hex string then to bigint
    const secretHashHex = Array.from(secretHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    const secret = BigInt('0x' + secretHashHex).toString();
    
    secrets[address.toLowerCase()] = secret;
    
    // Hash the secret to create the leaf (just the secret, not address+secret)
    // The circuit uses voterSecret directly, so leaf = hash(voterSecret)
    const leafHash = poseidon([BigInt(secret)]);
    // Poseidon returns Uint8Array, convert to bigint (same method as zkVoting.ts)
    const leafHashHex = Array.from(leafHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    leaves.push(BigInt('0x' + leafHashHex));
  }
  
  // Pad leaves to exactly 2^5 (32) with zeros
  // This ensures the tree is always exactly 5 levels deep
  const zeroLeaf = 0n;
  while (leaves.length < MAX_LEAVES) {
    leaves.push(zeroLeaf);
  }
  
  // Build full 5-level Merkle tree
  console.log('🌳 BUILDING MERKLE TREE:');
  console.log(`  Input: ${addresses.length} voter addresses`);
  console.log(`  After padding: ${leaves.length} leaves (${addresses.length} real + ${leaves.length - addresses.length} zero leaves)`);
  console.log(`  Expected depth: ${CIRCUIT_LEVELS} levels`);
  console.log(`  Expected tree structure: ${leaves.length} → ${leaves.length / 2} → ${leaves.length / 4} → ${leaves.length / 8} → ${leaves.length / 16} → 1 (root)`);
  console.log('');
  
  const tree = await buildMerkleTree(leaves, poseidon);
  const actualDepth = tree.length - 1;
  
  // Verify tree depth is exactly 5
  if (actualDepth !== CIRCUIT_LEVELS) {
    throw new Error(`Tree depth mismatch: expected ${CIRCUIT_LEVELS}, got ${actualDepth}. Leaves: ${leaves.length}, Expected: ${MAX_LEAVES}`);
  }
  
  const root = tree[tree.length - 1][0];
  const rootHex = root.toString(16);
  
  console.log(`✅ Merkle tree built successfully:`);
  console.log(`  Total levels: ${tree.length} (indices 0-${actualDepth})`);
  console.log(`  Depth: ${actualDepth} levels`);
  console.log(`  Root: ${root.toString()}`);
  console.log(`  Root (hex): 0x${rootHex.padStart(64, '0')}`);
  console.log('');
  
  return {
    root: '0x' + rootHex.padStart(64, '0'),
    secrets,
    tree
  };
}

/**
 * Build a Merkle tree from leaves using Poseidon
 * Keeps original tree structure (not extended)
 */
async function buildMerkleTree(leaves: bigint[], poseidon: any): Promise<bigint[][]> {
  const tree: bigint[][] = [leaves];
  let currentLevel = leaves;
  let levelIndex = 0;
  
  console.log(`  Level ${levelIndex}: ${currentLevel.length} nodes (leaves)`);
  
  // Build tree normally until we reach a single node (root)
  while (currentLevel.length > 1) {
    const nextLevel: bigint[] = [];
    levelIndex++;
    
    console.log(`  Level ${levelIndex}: Computing ${Math.ceil(currentLevel.length / 2)} nodes from ${currentLevel.length} parent nodes`);
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // Hash two nodes together
        const left = currentLevel[i];
        const right = currentLevel[i + 1];
        const hash = poseidon([left, right]);
        const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        const hashValue = BigInt('0x' + hashHex);
        nextLevel.push(hashValue);
        
        if (levelIndex <= 2) { // Only log first few levels to avoid spam
          console.log(`    [${i}, ${i + 1}]: hash(${left.toString().slice(0, 15)}..., ${right.toString().slice(0, 15)}...) = ${hashValue.toString().slice(0, 15)}...`);
        }
      } else {
        // Odd number of nodes, hash with itself
        const node = currentLevel[i];
        const hash = poseidon([node, node]);
        const hashHex = Array.from(hash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
        const hashValue = BigInt('0x' + hashHex);
        nextLevel.push(hashValue);
        
        if (levelIndex <= 2) {
          console.log(`    [${i}]: hash(${node.toString().slice(0, 15)}..., ${node.toString().slice(0, 15)}...) = ${hashValue.toString().slice(0, 15)}... (self-hash)`);
        }
      }
    }
    
    console.log(`  Level ${levelIndex}: ${nextLevel.length} nodes computed`);
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }
  
  console.log(`  Final root at level ${levelIndex}: ${currentLevel[0].toString()}`);
  console.log('');
  
  return tree;
}

/**
 * Get Merkle proof for a leaf
 * Since we always build a full 5-level tree, no padding is needed
 */
export async function getMerkleProof(
  tree: bigint[][],
  leafIndex: number,
  poseidon?: any
): Promise<{ pathElements: bigint[]; pathIndices: number[] }> {
  // Import poseidon if not provided
  if (!poseidon) {
    const { buildPoseidon } = await import('circomlibjs');
    poseidon = await buildPoseidon();
  }
  const pathElements: bigint[] = [];
  const pathIndices: number[] = [];
  
  let currentIndex = leafIndex;
  let currentLevel = 0;
  const CIRCUIT_LEVELS = 5; // Circuit expects exactly 5 levels
  
  console.log(`📝 GENERATING MERKLE PROOF:`);
  console.log(`  Leaf index: ${leafIndex}`);
  console.log(`  Tree depth: ${tree.length - 1} levels`);
  console.log(`  Circuit expects: ${CIRCUIT_LEVELS} levels`);
  console.log(`  Starting from level 0, leaf value: ${tree[0][leafIndex].toString().slice(0, 20)}...`);
  console.log('');
  
  // Traverse through all 5 levels of the tree
  // Since we always build a full tree, tree.length - 1 should equal CIRCUIT_LEVELS
  while (currentLevel < CIRCUIT_LEVELS && currentLevel < tree.length - 1) {
    const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
    const sibling = siblingIndex < tree[currentLevel].length 
      ? tree[currentLevel][siblingIndex]
      : tree[currentLevel][currentIndex]; // Use self if no sibling
    
    const pathIndex = currentIndex % 2;
    pathElements.push(sibling);
    pathIndices.push(pathIndex);
    
    console.log(`  Level ${currentLevel}:`);
    console.log(`    Current index: ${currentIndex}`);
    console.log(`    Sibling index: ${siblingIndex}`);
    console.log(`    Path index: ${pathIndex} (${pathIndex === 0 ? 'left=current, right=sibling' : 'left=sibling, right=current'})`);
    console.log(`    Current value: ${tree[currentLevel][currentIndex].toString().slice(0, 20)}...`);
    console.log(`    Sibling value: ${sibling.toString().slice(0, 20)}...`);
    
    currentIndex = Math.floor(currentIndex / 2);
    currentLevel++;
  }
  
  console.log(`  Generated ${pathElements.length} path elements and ${pathIndices.length} path indices`);
  console.log(`  Path indices: [${pathIndices.join(', ')}]`);
  console.log('');
  
  // Ensure we have exactly 5 elements
  if (pathElements.length !== CIRCUIT_LEVELS) {
    throw new Error(`Expected ${CIRCUIT_LEVELS} pathElements, got ${pathElements.length}. Tree depth: ${tree.length - 1}`);
  }
  
  return { pathElements, pathIndices };
}

/**
 * Get voter secret and Merkle proof for a specific address
 * This regenerates the tree from addresses to find the voter's data
 */
export async function getVoterCredentials(
  addresses: string[],
  voterAddress: string
): Promise<{ secret: string; proof: string[]; indices: number[] } | null> {
  const voterAddrLower = voterAddress.toLowerCase();
  const voterIndex = addresses.findIndex(addr => addr.toLowerCase() === voterAddrLower);
  
  if (voterIndex === -1) {
    return null; // Voter not in the list
  }
  
  // Regenerate the tree (same as generateMerkleTree but we need the tree structure)
  const poseidon = await buildPoseidon();
  const CIRCUIT_LEVELS = 5;
  const MAX_LEAVES = 2 ** CIRCUIT_LEVELS; // 2^5 = 32 leaves
  const leaves: bigint[] = [];
  
  for (const address of addresses) {
    const addressClean = address.startsWith('0x') ? address.slice(2) : address;
    const addressNum = BigInt('0x' + addressClean);
    const secretHash = poseidon([addressNum]);
    const secretHashHex = Array.from(secretHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    const secret = BigInt('0x' + secretHashHex).toString();
    
    // Hash the secret to create the leaf
    const leafHash = poseidon([BigInt(secret)]);
    const leafHashHex = Array.from(leafHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
    leaves.push(BigInt('0x' + leafHashHex));
  }
  
  // Pad leaves to exactly 2^5 (32) with zeros (same as generateMerkleTree)
  const zeroLeaf = 0n;
  while (leaves.length < MAX_LEAVES) {
    leaves.push(zeroLeaf);
  }
  
  // Build full 5-level tree
  const tree = await buildMerkleTree(leaves, poseidon);
  
  // Get voter's secret
  const addressClean = voterAddress.startsWith('0x') ? voterAddress.slice(2) : voterAddress;
  const addressNum = BigInt('0x' + addressClean);
  const secretHash = poseidon([addressNum]);
  const secretHashHex = Array.from(secretHash as unknown as Uint8Array).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  const secret = BigInt('0x' + secretHashHex).toString();
  
  // Get Merkle proof (no padding needed since tree is full)
  const { pathElements, pathIndices } = await getMerkleProof(tree, voterIndex, poseidon);
  
  return {
    secret,
    proof: pathElements.map(e => e.toString()),
    indices: pathIndices
  };
}
