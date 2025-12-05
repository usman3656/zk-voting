import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MerkleTree } from 'merkletreejs';
import { buildPoseidon } from 'circomlibjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Hash function compatible with Circom Poseidon
async function hashLeaf(address: string, secret: string, poseidon: any): Promise<bigint> {
  // Convert address to number (remove 0x prefix if present)
  const addressClean = address.startsWith('0x') ? address.slice(2) : address;
  const addressNum = BigInt('0x' + addressClean);
  
  // Convert secret to number
  const secretNum = BigInt(secret);
  
  // Use Poseidon hash (same as Circom circuit) - 2 inputs
  const hash = poseidon([addressNum, secretNum]);
  return BigInt(hash);
}

// Generate Merkle tree for voters
async function generateMerkleTree(voters: string[]) {
  console.log('='.repeat(70));
  console.log('🌳 Generating Merkle Tree for Voters');
  console.log('='.repeat(70));
  
  if (voters.length === 0) {
    console.error('❌ No voters provided');
    process.exit(1);
  }
  
  console.log(`\n📋 Processing ${voters.length} voters...`);
  
  // Initialize Poseidon
  console.log('   Initializing Poseidon hash function...');
  const poseidon = await buildPoseidon();
  
  // Generate secrets deterministically from address
  const leaves: bigint[] = [];
  const voterData: Array<{ address: string; secret: string; leaf: bigint }> = [];
  
  for (const address of voters) {
    // Generate secret deterministically: hash(address)
    const addressClean = address.startsWith('0x') ? address.slice(2) : address;
    const addressNum = BigInt('0x' + addressClean);
    const secretHash = poseidon([addressNum]);
    const secret = BigInt(secretHash).toString();
    const leaf = await hashLeaf(address, secret, poseidon);
    leaves.push(leaf);
    voterData.push({
      address,
      secret,
      leaf
    });
  }
  
  // Create Merkle tree with Poseidon hashing
  const tree = new MerkleTree(
    leaves.map(l => Buffer.from(l.toString(16).padStart(64, '0'), 'hex')),
    (a, b) => {
      // Use Poseidon for hashing (pairwise)
      const aNum = BigInt('0x' + a.toString('hex'));
      const bNum = BigInt('0x' + b.toString('hex'));
      const hash = poseidon([aNum, bNum]);
      return Buffer.from(BigInt(hash).toString(16).padStart(64, '0'), 'hex');
    },
    { sortPairs: false }
  );
  
  const root = tree.getRoot();
  const rootHex = '0x' + root.toString('hex');
  
  console.log(`\n✅ Merkle tree generated!`);
  console.log(`   Root: ${rootHex}`);
  console.log(`   Depth: ${tree.getDepth()}`);
  console.log(`   Leaves: ${leaves.length}`);
  
  // Generate proofs for each voter
  console.log('\n📝 Generating proofs for voters...');
  const proofs: Array<{
    address: string;
    secret: string;
    proof: string[];
    indices: number[];
  }> = [];
  
  for (let i = 0; i < voterData.length; i++) {
    const leafBuffer = Buffer.from(voterData[i].leaf.toString(16).padStart(64, '0'), 'hex');
    const proof = tree.getProof(leafBuffer);
    const indices = proof.map(p => p.position === 'right' ? 1 : 0);
    const proofHashes = proof.map(p => '0x' + p.data.toString('hex'));
    
    proofs.push({
      address: voterData[i].address,
      secret: voterData[i].secret,
      proof: proofHashes,
      indices
    });
  }
  
  // Save to file
  const outputDir = path.join(rootDir, 'circuits', 'merkle-trees');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const output = {
    root: rootHex,
    treeDepth: tree.getDepth(),
    numVoters: voters.length,
    voters: proofs,
    generatedAt: new Date().toISOString()
  };
  
  const outputPath = path.join(outputDir, `merkle-tree-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n✅ Merkle tree data saved to: ${outputPath}`);
  console.log('\n📋 Usage:');
  console.log('   Use this data to generate ZK proofs for voting');
  console.log('   Each voter needs their secret and proof from this file');
  
  return output;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const voters = process.argv.slice(2);
  if (voters.length === 0) {
    console.log('Usage: ts-node generate-merkle-tree.ts <address1> <address2> ...');
    console.log('Example: ts-node generate-merkle-tree.ts 0x123... 0x456...');
    process.exit(1);
  }
  generateMerkleTree(voters).catch(console.error);
}

export { generateMerkleTree, hashLeaf };

