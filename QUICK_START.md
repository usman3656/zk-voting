# 🚀 Quick Start Guide

## Automated Setup (Easiest Way!)

### Step 1: Start Hardhat Node
Open Terminal 1:
```bash
npm run node
```
**Keep this terminal running!**

### Step 2: Deploy and Setup
Open Terminal 2:
```bash
npm run setup
```

This automatically:
- ✅ Deploys the contract
- ✅ Updates `frontend/.env` with contract address  
- ✅ Creates `frontend/public/hardhat-accounts.json` with all accounts
- ✅ Accounts will be displayed on the frontend!

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 4: View Accounts on Frontend
- Open browser at `http://localhost:5173`
- You'll see **🔑 Hardhat Test Accounts** section at the top
- Click "Show Private Keys" to see all accounts
- Copy addresses/keys with one click!

### Step 5: Import Owner Account to MetaMask
- Click "Show Private Keys" on frontend
- Copy Account 1's private key
- Open MetaMask → Import Account → Private Key
- Paste the private key
- Switch to Hardhat Local network (Chain ID: 31337)

### Step 6: Start Voting! 🎉

---

## Hardhat Test Accounts (Auto-Loaded)

| Account | Role | Balance |
|---------|------|---------|
| Account 1 | 👑 Owner | 10000 ETH |
| Account 2-5 | 👤 Voters | 10000 ETH each |

All accounts are pre-funded and ready to use!

**Private keys are displayed on the frontend** - just click "Show Private Keys" button.

---

## What's Changed

✅ **Admin Panel** - Hidden (not needed for now)  
✅ **Accounts Display** - Shows all Hardhat accounts on frontend  
✅ **Auto Setup** - Script handles deployment and env updates  
✅ **Easy Copy** - Click to copy addresses and private keys  

---

## Troubleshooting

### Accounts not showing?
- Make sure you ran `npm run setup` after starting the node
- Check that `frontend/public/hardhat-accounts.json` exists
- Refresh the browser page

### Contract not found?
- Make sure Hardhat node is running
- Verify contract address in `frontend/.env` is correct
- Restart frontend dev server after updating `.env`

### Can't create proposals?
- Make sure you're using Account 1 (Owner) in MetaMask
- Verify you're on Hardhat network (Chain ID: 31337)

---

## Scripts Reference

- `npm run node` - Start Hardhat local blockchain
- `npm run setup` - Deploy contract + setup frontend
- `npm run deploy:host` - Just deploy (node must be running)

---

## Files Created

1. **`frontend/.env`** - Contract address
2. **`frontend/public/hardhat-accounts.json`** - All accounts (auto-loaded by frontend)

Both are created automatically by the setup script!
