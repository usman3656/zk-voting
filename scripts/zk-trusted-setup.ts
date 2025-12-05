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
const r1csPath = path.join(buildDir, 'vote.r1cs');
const finalZkeyPath = path.join(buildDir, 'vote_final.zkey');
const vkeyPath = path.join(buildDir, 'verification_key.json');

async function trustedSetup() {
  console.log('='.repeat(70));
  console.log('🔐 ZK Trusted Setup');
  console.log('='.repeat(70));
  console.log('\n⚠️  Using groth16 setup (simpler approach)');
  console.log('   This will create the proving key directly\n');
  
  if (!fs.existsSync(r1csPath)) {
    console.error('❌ R1CS file not found. Run: npm run zk:compile');
    process.exit(1);
  }
  
  // Check if snarkjs is available
  console.log('🔍 Checking snarkjs installation...');
  try {
    const versionOutput = execSync('npx snarkjs --version', { encoding: 'utf8', shell: true, stdio: 'pipe' });
    console.log('✅ snarkjs found:', versionOutput.trim().split('\n')[0]);
  } catch (error: any) {
    console.log('⚠️  snarkjs not found via npx, checking local installation...');
    try {
      // Check if it's in node_modules
      const snarkjsPath = path.join(rootDir, 'node_modules', 'snarkjs');
      if (fs.existsSync(snarkjsPath)) {
        console.log('✅ snarkjs found in node_modules');
      } else {
        console.log('   Installing snarkjs...');
        execSync('npm install snarkjs --save-dev', { stdio: 'inherit', shell: true, cwd: rootDir });
        console.log('✅ snarkjs installed');
      }
    } catch (installError) {
      console.error('❌ Failed to install snarkjs');
      console.log('   Please install manually: npm install snarkjs');
      process.exit(1);
    }
  }
  
  console.log('\n🔧 Running groth16 setup...');
  console.log('   This creates the proving key and verification key');
  console.log('   Note: This requires a ptau file. Checking...\n');
  
  // Check for ptau file (check multiple possible names)
  const possiblePtauFiles = [
    path.join(buildDir, 'powersOfTau28_hez_final_27.ptau'),
    path.join(buildDir, 'powersOfTau28_hez_final.ptau'),
    path.join(buildDir, 'ptau.ptau'),
  ];
  
  // Also check for any .ptau file in the build directory
  let ptauFile: string | null = null;
  if (fs.existsSync(buildDir)) {
    const files = fs.readdirSync(buildDir);
    for (const file of files) {
      if (file.endsWith('.ptau')) {
        const filePath = path.join(buildDir, file);
        const stats = fs.statSync(filePath);
        // Check if file is large enough (at least 100MB)
        if (stats.size > 100 * 1024 * 1024) {
          ptauFile = filePath;
          console.log(`   Found ptau file: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          break;
        }
      }
    }
  }
  
  // If not found, check the standard names
  if (!ptauFile) {
    for (const potPath of possiblePtauFiles) {
      if (fs.existsSync(potPath)) {
        ptauFile = potPath;
        break;
      }
    }
  }
  
  if (!ptauFile) {
    console.error('❌ Powers of Tau file not found!');
    console.log('\n💡 Please download the ptau file manually:');
    console.log('   1. Visit: https://github.com/iden3/snarkjs#7-prepare-phase-2');
    console.log('   2. Look for download links in the documentation');
    console.log('   3. Download powersOfTau28_hez_final_27.ptau (~1GB)');
    console.log(`   4. Save to: ${buildDir}`);
    console.log('   5. Then run: npm run zk:setup\n');
    console.log('   Alternative: Try these commands to download:');
    console.log('   curl -L -o circuits/build/powersOfTau28_hez_final_27.ptau \\');
    console.log('     https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_27.ptau');
    process.exit(1);
  }
  
  // Verify file size (should be ~1GB, at least 100MB)
  const stats = fs.statSync(ptauFile);
  const sizeMB = stats.size / (1024 * 1024);
  if (sizeMB < 100) {
    console.error(`❌ Invalid ptau file! File is only ${sizeMB.toFixed(2)} MB (should be ~1000 MB)`);
    console.log(`   Deleting invalid file: ${path.basename(ptauFile)}`);
    fs.unlinkSync(ptauFile);
    console.log('\n💡 Please download the ptau file manually (see instructions above)');
    process.exit(1);
  }
  
  console.log(`✅ Found ptau file: ${path.basename(ptauFile)} (${sizeMB.toFixed(2)} MB)\n`);
  
  try {
    const r1csPathQuoted = `"${r1csPath}"`;
    const ptauPathQuoted = `"${ptauFile}"`;
    const finalZkeyPathQuoted = `"${finalZkeyPath}"`;
    
    // Use groth16 setup with ptau file
    execSync(
      `npx snarkjs groth16 setup ${r1csPathQuoted} ${ptauPathQuoted} ${finalZkeyPathQuoted}`,
      { stdio: 'inherit', cwd: rootDir, shell: true }
    );
    
    console.log('\n🔑 Exporting verification key...');
    const vkeyPathQuoted = `"${vkeyPath}"`;
    execSync(
      `npx snarkjs zkey export verificationkey ${finalZkeyPathQuoted} ${vkeyPathQuoted}`,
      { stdio: 'inherit', cwd: rootDir, shell: true }
    );
    console.log('✅ Verification key exported');
    
    // Copy zkey file to public directory for frontend
    const publicZkeyDir = path.join(rootDir, 'frontend', 'public', 'circuits', 'build');
    if (!fs.existsSync(publicZkeyDir)) {
      fs.mkdirSync(publicZkeyDir, { recursive: true });
    }
    
    const zkeyDest = path.join(publicZkeyDir, 'vote_final.zkey');
    fs.copyFileSync(finalZkeyPath, zkeyDest);
    console.log('✅ Copied zkey file to frontend/public/circuits/build/');
    
  } catch (error: any) {
    console.error('\n❌ Setup failed');
    if (error.message && error.message.includes('ptau')) {
      console.log('\n💡 The groth16 setup requires a ptau file.');
      console.log('   Please download it manually:');
      console.log('   1. Visit: https://github.com/iden3/snarkjs#7-prepare-phase-2');
      console.log('   2. Download powersOfTau28_hez_final_27.ptau (~1GB)');
      console.log(`   3. Save to: ${buildDir}`);
      console.log('   4. Then run: npm run zk:setup\n');
      console.log('   Or use the manual setup commands:');
      console.log(`   npx snarkjs powersoftau prepare phase2 <ptau_file> ${path.join(buildDir, 'vote_0000.zkey')}`);
      console.log(`   npx snarkjs zkey new ${r1csPath} ${path.join(buildDir, 'vote_0000.zkey')} ${finalZkeyPath}`);
    }
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ Trusted Setup Complete!');
  console.log('='.repeat(70));
  console.log('\n📁 Generated files:');
  console.log(`   • Proving key: ${finalZkeyPath}`);
  console.log(`   • Verification key: ${vkeyPath}`);
  console.log('\n📋 Next step:');
  console.log('   npm run zk:generate-verifier');
}

trustedSetup().catch(console.error);
