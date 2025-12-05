// Fix circom file reading issue by ensuring proper encoding
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const circuitFile = path.join(__dirname, '..', 'circuits', 'vote.circom');
const buildDir = path.join(__dirname, '..', 'circuits', 'build');

console.log('Reading circuit file...');
let content = fs.readFileSync(circuitFile, 'utf8');

// Ensure Unix line endings
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// Write with explicit encoding
const tempFile = circuitFile + '.tmp';
fs.writeFileSync(tempFile, content, { encoding: 'utf8', flag: 'w' });

console.log('File size:', fs.statSync(tempFile).size);
console.log('First 100 chars:', JSON.stringify(content.substring(0, 100)));

// Try to compile
console.log('\nAttempting compilation...');
try {
  execSync(`npx circom "${tempFile}" --r1cs --wasm --sym -o "${buildDir}"`, {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });
  console.log('\n✅ SUCCESS! Circuit compiled.');
  // Replace original with fixed version
  fs.renameSync(tempFile, circuitFile);
} catch (error) {
  console.error('\n❌ Compilation failed');
  fs.unlinkSync(tempFile);
  process.exit(1);
}


