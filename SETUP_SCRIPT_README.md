# Automated Setup Scripts

## Quick Start (Easiest Way)

### Option 1: Two-Step Process (Recommended)

**Terminal 1 - Start Hardhat Node:**
```bash
npm run node
```
Keep this terminal running!

**Terminal 2 - Deploy and Setup:**
```bash
npm run setup
```

This will:
- ✅ Deploy the contract
- ✅ Update `frontend/.env` with contract address
- ✅ Create `frontend/public/hardhat-accounts.json` with all accounts
- ✅ Display accounts on the frontend

---

### Option 2: All-in-One Script (Windows/Linux/Mac)

**Bash Script (Linux/Mac/Git Bash):**
```bash
./scripts/full-setup.sh
```

**Or manually:**
```bash
bash scripts/full-setup.sh
```

This script:
- ✅ Starts Hardhat node in background
- ✅ Waits for it to be ready
- ✅ Deploys the contract
- ✅ Updates `frontend/.env`
- ✅ Creates accounts JSON file
- ✅ Keeps node running (Ctrl+C to stop)

---

## What Gets Created

### 1. `frontend/.env`
```
VITE_CONTRACT_ADDRESS=0x...
```

### 2. `frontend/public/hardhat-accounts.json`
Contains:
- All 5 Hardhat test accounts
- Addresses and private keys
- Contract address
- Network information

This file is automatically loaded by the frontend and displayed on the Dashboard!

---

## Hardhat Test Accounts

The script uses Hardhat's default test accounts:

| Account | Address | Role | Private Key |
|---------|---------|------|-------------|
| 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 👑 Owner | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 👤 Voter | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 👤 Voter | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| 4 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 👤 Voter | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| 5 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | 👤 Voter | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

**All accounts start with 10000 ETH for testing!**

---

## Frontend Display

The frontend will automatically:
- ✅ Load accounts from `hardhat-accounts.json`
- ✅ Display all accounts with addresses and private keys
- ✅ Show contract address
- ✅ Allow copying addresses/keys with one click
- ✅ Highlight owner account

**Location**: Top of the Dashboard page

---

## Complete Workflow

1. **Start Hardhat Node:**
   ```bash
   npm run node
   ```

2. **Deploy and Setup (in new terminal):**
   ```bash
   npm run setup
   ```

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Import Owner Account to MetaMask:**
   - Open MetaMask
   - Import Account → Private Key
   - Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - Switch to Hardhat Local network (Chain ID: 31337)

5. **Start Voting!** 🎉

---

## Troubleshooting

### "Hardhat node did not start in time"
- Make sure port 8545 is not already in use
- Try stopping any existing Hardhat node processes
- Restart and try again

### "Contract not deployed"
- Make sure Hardhat node is running first
- Check that it says "Started HTTP and WebSocket JSON-RPC server"
- Wait a few seconds after starting the node before running setup

### Accounts not showing on frontend
- Make sure `frontend/public/hardhat-accounts.json` exists
- Check browser console for errors
- Try refreshing the page

### Frontend can't connect
- Make sure Hardhat node is still running
- Check that contract address in `.env` is correct
- Verify you're on Hardhat network (Chain ID: 31337) in MetaMask

---

## Scripts Available

- `npm run node` - Start Hardhat node
- `npm run setup` - Deploy contract and setup frontend
- `npm run deploy:host` - Just deploy (requires node running)

---

## Admin Panel

**Note**: The Admin Panel is currently hidden. To show it, uncomment in `Dashboard.tsx`:

```tsx
{/* Admin Panel for legacy voter registration */}
{isOwner && (
  <AdminPanel
    onRegisterVoter={registerVoter}
    onRegisterVoters={registerVoters}
  />
)}
```

