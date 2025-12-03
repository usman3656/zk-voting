# 🤖 Automated Setup Guide

## Overview

This guide shows you how to use the automated setup scripts that:
1. Start Hardhat node
2. Deploy the contract
3. Automatically update `frontend/.env` with contract address
4. Create accounts file that the frontend can read
5. Display all accounts and private keys on the frontend

---

## Quick Start (Recommended - 2 Steps)

### Step 1: Start Hardhat Node
Open **Terminal 1** and run:
```bash
npm run node
```

**Keep this terminal running!** You'll see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Step 2: Deploy and Setup
Open **Terminal 2** (new terminal) and run:
```bash
npm run setup
```

This will:
- ✅ Wait for Hardhat node to be ready
- ✅ Deploy the contract
- ✅ Update `frontend/.env` with contract address
- ✅ Create `frontend/public/hardhat-accounts.json` with all accounts
- ✅ Show accounts in console

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

**Accounts will automatically appear on the frontend dashboard!** 🎉

---

## What You'll See

### On the Frontend:
1. **🔑 Hardhat Test Accounts** section at the top
   - Shows all 5 accounts
   - Contract address
   - Network information
   - "Show Private Keys" button

2. **Account Details:**
   - 👑 Account 1 (Owner) - highlighted in green
   - 👤 Accounts 2-5 (Voters) - in white boxes
   - Each shows: Address, Private Key (when shown), Balance
   - One-click copy buttons

3. **Easy Import:**
   - Click "Show Private Keys"
   - Click "Copy" next to Account 1's private key
   - Import into MetaMask

---

## Accounts Available

| Account | Address | Role | Private Key |
|---------|---------|------|-------------|
| 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 👑 Owner | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 👤 Voter | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 👤 Voter | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| 4 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 👤 Voter | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| 5 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | 👤 Voter | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

**All accounts start with 10000 ETH!**

---

## Files Created/Updated

### 1. `frontend/.env`
```
VITE_CONTRACT_ADDRESS=0x...
```
Automatically updated with deployed contract address.

### 2. `frontend/public/hardhat-accounts.json`
Contains all accounts, private keys, contract address, and network info.
This file is automatically loaded by the frontend component.

---

## Scripts Available

### `npm run node`
Starts Hardhat local blockchain on port 8545.

### `npm run setup`
Deploys contract and sets up frontend (requires node to be running).

### `npm run deploy:host`
Just deploys the contract (requires node to be running).

---

## Complete Workflow

```
Terminal 1: npm run node
                ↓
         [Node Running]
                ↓
Terminal 2: npm run setup
                ↓
    [Contract Deployed]
    [frontend/.env Updated]
    [Accounts JSON Created]
                ↓
Terminal 3: cd frontend && npm run dev
                ↓
    [Frontend Running]
    [Accounts Displayed]
                ↓
    [Import to MetaMask]
    [Start Voting!] 🎉
```

---

## Admin Panel

**Hidden by default** - Not displayed on the frontend.

To re-enable, edit `frontend/src/components/Dashboard.tsx`:
```tsx
{/* Admin Panel for legacy voter registration - HIDDEN */}
{isOwner && (
  <AdminPanel
    onRegisterVoter={registerVoter}
    onRegisterVoters={registerVoters}
  />
)}
```

Uncomment the AdminPanel section.

---

## Troubleshooting

### "Hardhat node did not start in time"
- Make sure port 8545 is not in use
- Stop any existing Hardhat node processes
- Try again

### Accounts not showing on frontend
- Make sure you ran `npm run setup` after starting the node
- Check that `frontend/public/hardhat-accounts.json` exists
- Refresh the browser page
- Check browser console for errors

### Contract address not updating
- Make sure you ran `npm run setup` (not just deploy)
- Check `frontend/.env` file exists and has the address
- **Restart frontend dev server** after updating `.env` (Vite caches env vars!)

### Frontend shows old contract address
- Vite caches environment variables
- **Must restart frontend dev server** after updating `.env`
- Stop frontend (Ctrl+C) and run `npm run dev` again

---

## Features

✅ **Auto-deployment** - One command deploys everything  
✅ **Auto-env update** - Frontend `.env` automatically updated  
✅ **Accounts on frontend** - All accounts displayed with private keys  
✅ **One-click copy** - Easy to copy addresses and keys  
✅ **Admin panel hidden** - Cleaner UI  
✅ **Auto-refresh** - Frontend checks for account updates every 5 seconds  

---

## Next Steps After Setup

1. ✅ Hardhat node running
2. ✅ Contract deployed
3. ✅ Frontend started
4. ✅ Accounts visible on frontend
5. **Import Account 1 to MetaMask** (use private key from frontend)
6. **Switch MetaMask to Hardhat Local** (Chain ID: 31337)
7. **Create proposals and vote!** 🗳️

---

Enjoy your automated setup! 🚀

