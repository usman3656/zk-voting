# 👑 How to Become Owner or Registered Voter

This guide explains how to become the **owner** of the contract or a **registered voter**.

## 🎯 Quick Overview

- **Owner**: The person who deploys the contract automatically becomes the owner
- **Registered Voter**: Only the owner can register voters. The owner must add your address.

---

## 1️⃣ How to Become the Owner

### What is the Owner?
The **owner** is the address that deployed the contract. This is set automatically during deployment in the contract constructor:
```solidity
constructor() {
    owner = msg.sender;  // The deployer becomes the owner
}
```

### Steps to Become Owner:

#### Option A: Deploy the Contract Yourself

**1. Make sure you have Hardhat set up:**
```bash
npm install
```

**2. Deploy the contract:**
```bash
npm run deploy:local
```

**Output:**
```
Deploying SimpleVoting contract...
SimpleVoting deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deployment successful!
```

The address shown as "Owner" is now the owner of the contract!

#### Option B: Deploy to a Running Node

**Terminal 1 - Start Hardhat node:**
```bash
npm run node
```

**Terminal 2 - Deploy to the running node:**
```bash
npx hardhat run scripts/deploy-voting.ts --network localhost
```

**Note**: The account that deploys becomes the owner. In Hardhat, the first account is usually the deployer.

#### Option C: Use the Frontend (Future Enhancement)
Currently, deployment is done via scripts. Once deployed, use the frontend with the owner account.

---

## 2️⃣ How to Become a Registered Voter

### What is a Registered Voter?
A **registered voter** is an address that has been added by the owner and can vote on proposals.

### Important: Only the Owner Can Register Voters!

### Steps to Become a Registered Voter:

#### Option A: Using the Frontend (Easiest!)

**1. Connect as Owner:**
- Open the frontend (`npm run dev` in the frontend folder)
- Connect MetaMask with the **owner's wallet address**

**2. Find Your Address:**
- Copy the wallet address you want to register (from MetaMask)
- It should look like: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

**3. Register Yourself or Others:**
- In the Admin Panel section, find "Register Single Voter"
- Paste the address
- Click "Register Voter"
- Wait for confirmation

**4. Register Multiple Voters at Once:**
- Use "Register Multiple Voters" section
- Enter addresses separated by commas or new lines:
  ```
  0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
  0x8ba1f109551bD432803012645Hac136c8282F3F5
  0x1234567890123456789012345678901234567890
  ```
- Click "Register All Voters"

#### Option B: Using Hardhat Console

**1. Start Hardhat Console:**
```bash
npx hardhat console --network localhost
```

**2. Get the contract instance:**
```javascript
const voting = await ethers.getContractAt("SimpleVoting", "CONTRACT_ADDRESS");
// Replace CONTRACT_ADDRESS with your deployed contract address
```

**3. Register a voter (as owner):**
```javascript
// Get the owner signer
const [owner] = await ethers.getSigners();

// Register a single voter
const voterAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
await voting.connect(owner).registerVoter(voterAddress);

// Or register multiple voters
const voters = [
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "0x8ba1f109551bD432803012645Hac136c8282F3F5"
];
await voting.connect(owner).registerVoters(voters);
```

#### Option C: Using a Deployment Script

Create a script to register voters after deployment:

```typescript
// scripts/register-voters.ts
import { network } from "hardhat";
const { ethers } = await network.connect();

async function main() {
  const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";
  const voters = [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "0x8ba1f109551bD432803012645Hac136c8282F3F5"
  ];

  const voting = await ethers.getContractAt("SimpleVoting", CONTRACT_ADDRESS);
  const [owner] = await ethers.getSigners();

  console.log("Registering voters...");
  const tx = await voting.connect(owner).registerVoters(voters);
  await tx.wait();
  console.log("Voters registered successfully!");
}

main().catch(console.error);
```

Run it:
```bash
npx hardhat run scripts/register-voters.ts --network localhost
```

---

## 🔍 How to Check Your Status

### Check if You're the Owner:

**Frontend:**
- Connect your wallet
- Look at the "Your Status" card in the dashboard
- If it shows "👑 Owner", you're the owner!

**Hardhat Console:**
```javascript
const owner = await voting.owner();
console.log("Contract owner:", owner);
console.log("Am I owner?", owner.toLowerCase() === (await ethers.getSigners())[0].address.toLowerCase());
```

### Check if You're a Registered Voter:

**Frontend:**
- Connect your wallet
- Look at the "Your Status" card
- If it shows "✓ Voter", you're registered!
- If it shows "Not Registered", you need the owner to register you

**Hardhat Console:**
```javascript
const yourAddress = "YOUR_WALLET_ADDRESS";
const isRegistered = await voting.isRegisteredVoter(yourAddress);
console.log("Am I registered?", isRegistered);
```

---

## 📋 Step-by-Step Example: Full Setup

### Scenario: You want to be both Owner and have registered voters

**Step 1: Deploy the contract (become owner)**
```bash
npm run deploy:local
```
Note the contract address and that your address is the owner.

**Step 2: Update frontend with contract address**
```bash
cd frontend
echo "VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3" > .env
# Replace with your actual contract address
```

**Step 3: Start the frontend**
```bash
npm run dev
```

**Step 4: Connect MetaMask as owner**
- Open the frontend in browser
- Connect MetaMask with the owner account
- You should see "👑 Owner" status

**Step 5: Register voters through the frontend**
- In the Admin Panel, register voter addresses
- You can register multiple addresses at once
- Each registered address can now vote!

**Step 6: Test voting**
- Switch MetaMask to a registered voter account
- You should see "✓ Voter" status
- You can now vote on proposals!

---

## ⚠️ Important Notes

### Owner:
- ✅ Only ONE owner per contract (set at deployment)
- ✅ Owner can create proposals
- ✅ Owner can register voters
- ✅ Owner CAN vote if also registered as a voter
- ❌ Owner status cannot be transferred (in current contract)

### Registered Voter:
- ✅ Multiple voters can be registered
- ✅ Only owner can register voters
- ✅ Registered voters can vote on proposals
- ✅ Each voter can vote once per proposal
- ❌ Voters cannot create proposals or register other voters

### Getting Your Wallet Address:

**MetaMask:**
1. Click on your account icon
2. Click to copy your address
3. It starts with `0x...`

**Hardhat:**
```javascript
const signers = await ethers.getSigners();
console.log("Account 0:", signers[0].address);  // Usually the owner
console.log("Account 1:", signers[1].address);  // Could be a voter
```

---

## 🎯 Quick Reference

| Role | How to Get It | What You Can Do |
|------|--------------|-----------------|
| **Owner** | Deploy the contract | Create proposals, Register voters |
| **Registered Voter** | Owner registers you | Vote on proposals |
| **Public** | Just connect wallet | View proposals (read-only) |

---

## 🚀 Common Use Cases

### Use Case 1: Testing by Yourself
1. Deploy contract (you become owner)
2. Register your own address as voter
3. Create proposals
4. Vote on them

### Use Case 2: Multi-User Testing
1. Deploy contract (you become owner)
2. Get addresses from your test accounts
3. Register all test addresses as voters
4. Each account can vote independently

### Use Case 3: Demo Setup
1. Deploy contract
2. Register 3-5 demo voter addresses
3. Create some sample proposals
4. Have users vote on them

---

## ❓ FAQ

**Q: Can I change the owner?**
A: No, the owner is set at deployment and cannot be changed in the current contract.

**Q: Can I remove a registered voter?**
A: No, once registered, a voter cannot be removed in the current contract. They remain registered permanently.

**Q: Can the owner vote without being registered?**
A: No, the owner must also be registered as a voter to vote.

**Q: How many voters can I register?**
A: Unlimited! You can register as many voters as you need.

**Q: What if I want to test with multiple accounts?**
A: Use Hardhat's multiple signers or different MetaMask accounts. Register each address as a voter.

---

## 📝 Summary

1. **To become Owner**: Deploy the contract yourself using `npm run deploy:local`
2. **To become Registered Voter**: Have the owner register your address via:
   - Frontend Admin Panel (easiest)
   - Hardhat console
   - Deployment script

**That's it!** Once you're set up, you can create proposals and vote directly from the frontend! 🎉

