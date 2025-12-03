# ⚡ Quick Fix: Wrong Network Error

## Problem
MetaMask is on Chain ID 1 (Mainnet) but needs Chain ID 31337 (Hardhat)

## Solution: Add Hardhat Network to MetaMask

### Step-by-Step:

1. **Open MetaMask** (click the extension icon)

2. **Click the network dropdown** at the top (shows "Ethereum Mainnet")

3. **Click "Add Network"** or "Add a network manually"

4. **Fill in these EXACT values:**
   ```
   Network Name: Hardhat Local
   RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   Currency Symbol: ETH
   Block Explorer: (leave empty)
   ```

5. **Click "Save"**

6. **Switch to Hardhat Local** (it should switch automatically, or select it from dropdown)

7. **Refresh your browser page**

## Done! ✅

The error should be gone now.

## Important

⚠️ Make sure Hardhat node is running:
```bash
npm run node
```

## Automatic Fix

I've also added automatic network switching. When you refresh:
- Frontend detects wrong network
- MetaMask will popup asking to add/switch network
- Just click "Approve"

If automatic doesn't work, use manual steps above!

