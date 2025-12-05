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

async function setupCircuit() {
  console.log('='.repeat(70));
  console.log('🔐 ZK Circuit Setup');
  console.log('='.repeat(70));
  
  // Check if circom is installed (try cargo-installed Circom 2.x first)
  let circomCmd = '';
  const cargoCircomPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cargo', 'bin', 'circom');
  const cargoCircomPathWin = path.join(process.env.USERPROFILE || '', '.cargo', 'bin', 'circom.exe');
  
  try {
    // Try cargo-installed circom first (Circom 2.x)
    const testPath = process.platform === 'win32' ? cargoCircomPathWin : cargoCircomPath;
    if (fs.existsSync(testPath)) {
      const versionOutput = execSync(`"${testPath}" --version`, { encoding: 'utf8' });
      if (versionOutput.includes('2.')) {
        console.log('✅ Circom 2.x compiler found (cargo)');
        circomCmd = `"${testPath}"`;
      }
    }
  } catch (error) {
    // Continue to try other options
  }
  
  // If cargo circom not found, try system PATH
  if (!circomCmd) {
    try {
      const versionOutput = execSync('circom --version', { encoding: 'utf8' });
      if (versionOutput.includes('2.')) {
        console.log('✅ Circom 2.x compiler found (PATH)');
        circomCmd = 'circom';
      }
    } catch (error) {
      // Continue to npm fallback
    }
  }
  
  // Fallback to npm circom (0.5.x)
  if (!circomCmd) {
    try {
      execSync('npx circom --version', { stdio: 'ignore', cwd: rootDir });
      console.log('⚠️  Using npm Circom 0.5.x (may have parser bugs)');
      circomCmd = 'npx circom';
    } catch (error2) {
      console.error('❌ Circom compiler not found!');
      console.log('\n💡 Install Circom 2.0:');
      console.log('   cargo install --git https://github.com/iden3/circom.git --locked');
      process.exit(1);
    }
  }
  
  // Create directories
  if (!fs.existsSync(circuitsDir)) {
    fs.mkdirSync(circuitsDir, { recursive: true });
    console.log('✅ Created circuits directory');
  }
  
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
    console.log('✅ Created build directory');
  }
  
  const circuitPath = path.join(circuitsDir, 'vote.circom');
  if (!fs.existsSync(circuitPath)) {
    console.error('❌ Circuit file not found:', circuitPath);
    process.exit(1);
  }
  
  console.log('\n📦 Compiling circuit...');
  try {
    // Use npx to ensure we use the correct circom version
    // Add -l node_modules for include paths
    // Properly quote paths to handle spaces
    const circuitPathQuoted = `"${circuitPath}"`;
    const buildDirQuoted = `"${buildDir}"`;
    // Use the detected circom command
    execSync(`${circomCmd} ${circuitPathQuoted} --r1cs --wasm --sym -o ${buildDirQuoted} -l node_modules`, {
      stdio: 'inherit',
      cwd: rootDir,
      shell: true
    });
    console.log('✅ Circuit compiled successfully!');
  } catch (error: any) {
    console.error('❌ Circuit compilation failed');
    if (error.stdout) console.error(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    process.exit(1);
  }
  
  // Copy WASM file to public directory for frontend
  const publicWasmDir = path.join(rootDir, 'frontend', 'public', 'circuits', 'build');
  if (!fs.existsSync(publicWasmDir)) {
    fs.mkdirSync(publicWasmDir, { recursive: true });
  }
  
  const wasmSource = path.join(buildDir, 'vote_js', 'vote.wasm');
  const wasmDest = path.join(publicWasmDir, 'vote.wasm');
  
  if (fs.existsSync(wasmSource)) {
    fs.copyFileSync(wasmSource, wasmDest);
    console.log('✅ Copied WASM file to frontend/public/circuits/build/');
  } else {
    console.log('⚠️  WASM file not found, skipping copy');
  }
  
  console.log('\n📋 Next steps:');
  console.log('   1. Run trusted setup: npm run zk:setup');
  console.log('   2. Generate verifier: npm run zk:generate-verifier');
}

setupCircuit().catch(console.error);

