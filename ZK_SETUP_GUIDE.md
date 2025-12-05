# 🔐 ZK Voting Setup Guide

This guide explains how to set up and deploy the Zero-Knowledge voting system.

## 📚 Understanding the Terms

### What is "Deploying Contracts"?

**Deploying contracts** means uploading your compiled Solidity smart contract code to a blockchain network (like Hardhat local network or Sepolia testnet). Think of it like:

- **Local Development**: Deploying to Hardhat = running on your computer
- **Testnet**: Deploying to Sepolia = running on a public test network

When you deploy:
1. The contract code is uploaded to the blockchain
2. You get a contract address (like `0x1234...`)
3. You can interact with it using that address

**For ZK Voting, we need to deploy TWO contracts:**
1. `ZKVotingVerifier` - Verifies ZK proofs (generated from your circuit)
2. `SimpleVoting` - Main voting contract (uses the verifier)

### What is "Copying Circuit Files"?

**Circuit files** are the compiled ZK circuit that the frontend needs to generate proofs in the browser. These files are:
- `vote.wasm` - The compiled circuit (WebAssembly)
- `vote_final.zkey` - The proving key (used to generate proofs)

**Why copy them?** The frontend runs in the browser and needs to download these files via HTTP. By copying them to `frontend/public/circuits/build/`, they become accessible at:
- `http://localhost:5173/circuits/build/vote.wasm`
- `http://localhost:5173/circuits/build/vote_final.zkey`

---

## 🚀 Complete Setup Process

### Step 1: Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### Step 2: Compile the ZK Circuit

This compiles your Circom circuit into WebAssembly and R1CS format.

```bash
npm run zk:compile
```

**What happens:** Creates `circuits/build/vote.wasm` and `circuits/build/vote.r1cs`

### Step 3: Run Trusted Setup

This generates the proving key and verification key for your circuit.

```bash
npm run zk:setup
```

**What happens:** 
- Downloads Powers of Tau (if needed)
- Generates `circuits/build/vote_final.zkey` (proving key)
- Generates `circuits/build/verification_key.json` (verification key)

**Note:** This may take 5-10 minutes the first time (downloads ~1GB file).

### Step 4: Generate Verifier Contract

This creates the Solidity verifier contract from your circuit.

```bash
npm run zk:generate-verifier
```

**What happens:** Creates `contracts/ZKVotingVerifier.sol`

### Step 5: Compile Solidity Contracts

Compile all contracts including the new verifier.

```bash
npm run compile
```

### Step 6: Deploy Contracts

Choose one:

**Option A: Local Hardhat Network**
```bash
# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contracts
npm run zk:deploy
```

**Option B: Testnet (Sepolia)**
```bash
# Make sure you have .env file with:
# SEPOLIA_RPC_URL=https://...
# SEPOLIA_PRIVATE_KEY=0x...

npm run zk:deploy:sepolia
```

**What happens:**
1. Deploys `ZKVotingVerifier` contract
2. Deploys `SimpleVoting` contract (with verifier address)
3. Updates `frontend/.env` with contract addresses

### Step 7: Copy Circuit Files to Frontend

This makes the circuit files accessible to the frontend.

```bash
npm run zk:copy-files
```

**What happens:** Copies files from `circuits/build/` to `frontend/public/circuits/build/`

### Step 8: Generate Merkle Tree for Voters

Create a Merkle tree of eligible voters for your ZK proposal.

```bash
npm run zk:merkle 0xAddress1 0xAddress2 0xAddress3
```

**What happens:** Creates `circuits/merkle-trees/merkle-tree-{timestamp}.json` with:
- Merkle root (to use when creating ZK proposal)
- Voter secrets and proofs (to give to voters)

### Step 9: Start Frontend

```bash
cd frontend && npm run dev
```

---

## 📋 Quick Reference

### All ZK Commands

```bash
# Circuit setup
npm run zk:compile              # Compile circuit
npm run zk:setup                # Trusted setup
npm run zk:generate-verifier     # Generate verifier contract

# Deployment
npm run compile                 # Compile Solidity contracts
npm run zk:deploy               # Deploy to Hardhat (local)
npm run zk:deploy:sepolia       # Deploy to Sepolia testnet

# Frontend setup
npm run zk:copy-files           # Copy circuit files to frontend

# Voter management
npm run zk:merkle <addresses>   # Generate Merkle tree
```

### File Locations

```
circuits/
├── vote.circom                 # Circuit source code
└── build/
    ├── vote.wasm              # Compiled circuit
    ├── vote_final.zkey        # Proving key
    └── verification_key.json  # Verification key

contracts/
├── SimpleVoting.sol           # Main voting contract
└── ZKVotingVerifier.sol       # Generated verifier

frontend/
└── public/
    └── circuits/
        └── build/             # Copied circuit files (for browser)
```

---

## ❓ Common Questions

### Q: Do I need to deploy contracts every time?

**A:** Only if:
- You change the contract code
- You change the circuit (need new verifier)
- You switch networks (local vs testnet)

### Q: Do I need to copy circuit files every time?

**A:** Only if:
- You recompile the circuit
- You regenerate the proving key
- You delete the frontend/public folder

### Q: Can I skip trusted setup?

**A:** No, the trusted setup is required to generate the proving key. However, you can reuse the same setup for multiple deployments.

### Q: What if deployment fails?

**A:** Check:
1. Is Hardhat node running? (for local)
2. Do you have testnet ETH? (for testnet)
3. Are environment variables set? (for testnet)
4. Is the verifier contract generated? (`contracts/ZKVotingVerifier.sol`)

---

## 🎯 Next Steps After Setup

1. **Create a ZK Proposal:**
   - Use the Merkle root from `zk:merkle` command
   - Call `createZKProposal()` on the contract

2. **Distribute Voter Credentials:**
   - Give each voter their secret and Merkle proof from the generated JSON file

3. **Vote:**
   - Voters use the frontend to generate ZK proofs and vote anonymously

4. **Tally Votes:**
   - After voting ends, owner calls `revealZKVotes()` to decrypt and count votes

---

## 📝 Summary

**Deploying contracts** = Uploading smart contracts to blockchain  
**Copying circuit files** = Making ZK circuit accessible to frontend browser

Both are necessary for the ZK voting system to work!


