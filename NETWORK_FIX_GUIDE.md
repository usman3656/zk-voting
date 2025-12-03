# 🔧 Fix: Wrong Network Error

## The Problem

You're seeing: `"Wrong network! Expected Chain ID 31337 (Hardhat), but connected to Chain ID 1"`

This means MetaMask is connected to Ethereum Mainnet instead of Hardhat.

## Quick Fix (3 Steps)

### Step 1: Add Hardhat Network to MetaMask

1. Open MetaMask
2. Click the network dropdown (top of MetaMask, currently shows "Ethereum Mainnet")
3. Click **"Add Network"** or **"Add a network manually"**
4. Enter these details:
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
5. Click **"Save"**

### Step 2: Switch to Hardhat Network

1. Click the network dropdown again
2. Select **"Hardhat Local"**

### Step 3: Refresh Browser

Refresh your browser page (or restart frontend if needed)

## Alternative: Automatic Fix

I've added automatic network switching. When you refresh the page:

1. The frontend will detect you're on the wrong network
2. MetaMask will pop up asking to add/switch to Hardhat network
3. Click **"Approve"** or **"Switch Network"** in MetaMask
4. Done!

## Verify It Worked

- MetaMask should show **"Hardhat Local"** as the network
- The error message should disappear
- Contract should load successfully

## Important: Hardhat Node Must Be Running

⚠️ **Make sure Hardhat node is running:**

```bash
npm run node
```

Keep this terminal open while using the frontend!

## Network Details

```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH
```

That's it! Once you switch to Hardhat network, everything should work.

