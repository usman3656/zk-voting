import * as fs from 'fs';
import * as path from 'path';

console.log("=".repeat(70));
console.log("🔍 SETUP VERIFICATION");
console.log("=".repeat(70));

// Check 1: Contract deployment
console.log("\n1️⃣ Checking contract deployment...");
try {
  const deployOutput = fs.readFileSync('.deployment', 'utf-8');
  const contractMatch = deployOutput.match(/SimpleVoting deployed to: (0x[a-fA-F0-9]{40})/);
  const ownerMatch = deployOutput.match(/Owner: (0x[a-fA-F0-9]{40})/);
  
  if (contractMatch && ownerMatch) {
    console.log(`   ✅ Contract Address: ${contractMatch[1]}`);
    console.log(`   ✅ Owner Address: ${ownerMatch[1]}`);
  } else {
    console.log("   ⚠️  Could not find deployment info. Run 'npm run deploy:host' first.");
  }
} catch (e) {
  console.log("   ⚠️  No deployment file found. Run 'npm run deploy:host' first.");
}

// Check 2: Frontend .env
console.log("\n2️⃣ Checking frontend configuration...");
const envPath = path.join(__dirname, '../frontend/.env');
try {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const contractMatch = envContent.match(/VITE_CONTRACT_ADDRESS=(0x[a-fA-F0-9]{40})/);
  
  if (contractMatch) {
    console.log(`   ✅ Frontend .env configured: ${contractMatch[1]}`);
  } else {
    console.log("   ❌ VITE_CONTRACT_ADDRESS not found in frontend/.env");
  }
} catch (e) {
  console.log("   ❌ frontend/.env file not found!");
  console.log("   Create it with: VITE_CONTRACT_ADDRESS=<your_contract_address>");
}

// Check 3: Hardhat node running
console.log("\n3️⃣ Checking Hardhat node...");
console.log("   ℹ️  Make sure 'npm run node' is running in another terminal");

// Check 4: Package installations
console.log("\n4️⃣ Checking dependencies...");
const rootPkg = path.join(__dirname, '../package.json');
const frontendPkg = path.join(__dirname, '../frontend/package.json');

if (fs.existsSync(rootPkg) && fs.existsSync(path.join(__dirname, '../node_modules'))) {
  console.log("   ✅ Root dependencies installed");
} else {
  console.log("   ⚠️  Run 'npm install' in root directory");
}

if (fs.existsSync(frontendPkg) && fs.existsSync(path.join(__dirname, '../frontend/node_modules'))) {
  console.log("   ✅ Frontend dependencies installed");
} else {
  console.log("   ⚠️  Run 'npm install' in frontend directory");
}

console.log("\n" + "=".repeat(70));
console.log("✅ Verification complete!");
console.log("=".repeat(70));
console.log("\n📋 Next steps:");
console.log("1. Start Hardhat node: npm run node");
console.log("2. Deploy contract: npm run deploy:host");
console.log("3. Update frontend/.env with contract address");
console.log("4. Start frontend: cd frontend && npm run dev");
console.log("5. Import owner account into MetaMask");
console.log("6. Connect wallet and test!");

