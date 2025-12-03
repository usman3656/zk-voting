# 🚀 How to Deploy Contract and Fix Address Error

## The Error

```
Error: No contract found at address 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
```

This means the contract doesn't exist at that address (Hardhat node was probably restarted).

## Step-by-Step Fix

### Step 1: Make Sure Hardhat Node is Running

**Terminal 1** - Start Hardhat node (if not running):

```bash
npm run node
```

Keep this terminal open! The node must be running.

### Step 2: Deploy the Contract

**Terminal 2** (NEW terminal) - Deploy the contract:

```bash
npm run deploy:host
```

You should see:
```
Deploying SimpleVoting contract...
SimpleVoting deployed to: 0x...
Owner: 0x...
Deployment successful!
```

**COPY THE CONTRACT ADDRESS** (the `0x...` after "deployed to:")

### Step 3: Update Frontend .env

**Terminal 3** (or same as Terminal 2) - Update frontend:

```bash
cd frontend
echo "VITE_CONTRACT_ADDRESS=PASTE_THE_ADDRESS_HERE" > .env
```

Replace `PASTE_THE_ADDRESS_HERE` with the address from Step 2.

For example:
```bash
echo "VITE_CONTRACT_ADDRESS=0xa513E6E4b8f2a923D98304ec87F64353C4D5C853" > .env
```

### Step 4: Restart Frontend

If frontend is running, stop it (Ctrl+C) and restart:

```bash
cd frontend
npm run dev
```

### Step 5: Refresh Browser

Hard refresh: **Ctrl+Shift+R** (or **Cmd+Shift+R** on Mac)

## Troubleshooting

### "Missing script: deploy:host"

If you get this error:

1. Make sure you're in the **root directory** (not frontend/)
2. Check if node_modules exists: `ls node_modules` (or `dir node_modules` on Windows)
3. If node_modules is missing, run: `npm install`

### "Connection refused" or Network Error

- Make sure Hardhat node is running in Terminal 1
- Check it says: "Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/"

### Contract Address Not Working

- Make sure you copied the **exact** address (case-sensitive)
- Restart frontend dev server after updating .env
- Hard refresh browser

## Quick One-Liner (After Node is Running)

```bash
# Deploy and update in one go (run from root directory)
CONTRACT_ADDR=$(npm run deploy:host 2>&1 | grep "deployed to:" | awk '{print $NF}') && \
cd frontend && \
echo "VITE_CONTRACT_ADDRESS=$CONTRACT_ADDR" > .env && \
echo "✅ Updated frontend/.env with $CONTRACT_ADDR"
```

## Important Notes

⚠️ **Every time you restart the Hardhat node, you MUST:**
1. Redeploy the contract
2. Update frontend/.env with the new address
3. Restart frontend dev server

The blockchain resets when the node restarts, so old contract addresses no longer exist!

