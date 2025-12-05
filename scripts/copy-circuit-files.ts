import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Copy Circuit Files to Frontend
 * 
 * This script copies the compiled circuit files to the frontend public folder.
 * 
 * Why? The frontend needs these files to generate ZK proofs in the browser:
 * - vote.wasm: Compiled circuit (WebAssembly)
 * - vote_final.zkey: Proving key for generating proofs
 * 
 * These files are served as static assets so the browser can download and use them.
 */
async function copyCircuitFiles() {
  console.log('='.repeat(70));
  console.log('📋 Copying Circuit Files to Frontend');
  console.log('='.repeat(70));
  
  const circuitsBuildDir = path.join(rootDir, 'circuits', 'build');
  const frontendPublicDir = path.join(rootDir, 'frontend', 'public', 'circuits', 'build');
  
  // Files to copy
  const filesToCopy = [
    'vote.wasm',
    'vote_final.zkey',
    'verification_key.json'
  ];
  
  // Check if source directory exists
  if (!fs.existsSync(circuitsBuildDir)) {
    console.error('\n❌ Error: circuits/build directory not found!');
    console.log('\n💡 Run these commands first:');
    console.log('   npm run zk:compile');
    console.log('   npm run zk:setup');
    console.log('   npm run zk:generate-verifier');
    process.exit(1);
  }
  
  // Create destination directory
  if (!fs.existsSync(frontendPublicDir)) {
    fs.mkdirSync(frontendPublicDir, { recursive: true });
    console.log(`✅ Created directory: ${frontendPublicDir}`);
  }
  
  console.log(`\n📁 Source: ${circuitsBuildDir}`);
  console.log(`📁 Destination: ${frontendPublicDir}\n`);
  
  let copiedCount = 0;
  let missingCount = 0;
  
  // Copy each file
  for (const filename of filesToCopy) {
    // WASM file is in vote_js subdirectory
    let sourcePath = path.join(circuitsBuildDir, filename);
    if (filename === 'vote.wasm' && !fs.existsSync(sourcePath)) {
      sourcePath = path.join(circuitsBuildDir, 'vote_js', filename);
    }
    
    const destPath = path.join(frontendPublicDir, filename);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
      const stats = fs.statSync(sourcePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Copied: ${filename} (${sizeMB} MB)`);
      copiedCount++;
    } else {
      console.log(`⚠️  Missing: ${filename}`);
      missingCount++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  if (copiedCount === filesToCopy.length) {
    console.log('✅ All files copied successfully!');
  } else if (copiedCount > 0) {
    console.log(`⚠️  Copied ${copiedCount}/${filesToCopy.length} files`);
    console.log('   Some files are missing. Make sure to run:');
    console.log('   npm run zk:compile');
    console.log('   npm run zk:setup');
  } else {
    console.log('❌ No files copied!');
    console.log('   Please run the ZK setup commands first.');
  }
  console.log('='.repeat(70));
  
  console.log('\n📋 What these files do:');
  console.log('   • vote.wasm: Compiled circuit (used to generate proofs)');
  console.log('   • vote_final.zkey: Proving key (used to generate proofs)');
  console.log('   • verification_key.json: Verification key (optional, for client-side verification)');
  console.log('\n🌐 These files are now accessible at:');
  console.log('   http://localhost:5173/circuits/build/vote.wasm');
  console.log('   http://localhost:5173/circuits/build/vote_final.zkey');
  console.log('\n');
}

copyCircuitFiles().catch(console.error);

