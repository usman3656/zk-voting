import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const circuitsDir = path.join(rootDir, 'circuits');
const buildDir = path.join(circuitsDir, 'build');
const finalZkeyPath = path.join(buildDir, 'vote_final.zkey');
const contractsDir = path.join(rootDir, 'contracts');
const verifierPath = path.join(contractsDir, 'ZKVotingVerifier.sol');

async function generateVerifier() {
  console.log('='.repeat(70));
  console.log('🔐 Generating Verifier Contract');
  console.log('='.repeat(70));
  
  if (!fs.existsSync(finalZkeyPath)) {
    console.error('❌ Proving key not found. Run: npm run zk:setup');
    process.exit(1);
  }
  
  console.log('\n📝 Generating Solidity verifier contract...');
  try {
    // Properly quote paths to handle spaces
    const finalZkeyPathQuoted = `"${finalZkeyPath}"`;
    const verifierPathQuoted = `"${verifierPath}"`;
    execSync(
      `npx snarkjs zkey export solidityverifier ${finalZkeyPathQuoted} ${verifierPathQuoted}`,
      { stdio: 'inherit', cwd: rootDir, shell: true }
    );
    console.log('✅ Verifier contract generated!');
    console.log(`   Location: ${verifierPath}`);
  } catch (error) {
    console.error('❌ Failed to generate verifier contract');
    process.exit(1);
  }
  
  console.log('\n📋 Next step:');
  console.log('   Update SimpleVoting.sol to use ZKVotingVerifier');
}

generateVerifier().catch(console.error);

