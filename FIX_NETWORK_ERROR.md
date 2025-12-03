# ✅ Fix: Wrong Network Error

## The Problem

MetaMask is connected to **Chain ID 1 (Ethereum Mainnet)** but you need **Chain ID 31337 (Hardhat)**.

## Solution 1: Automatic Fix (Recommended)

I've added automatic network switching. When you refresh the page, MetaMask will:
1. Detect you're on the wrong network
2. Automatically prompt you to add/switch to Hardhat network
3. You just need to click "Approve" in MetaMask

**Just refresh your browser page and approve the network switch when MetaMask asks!**

## Solution 2: Manual Fix

If automatic switching doesn't work, follow these steps:

### Step 1: Open MetaMask

Click the MetaMask extension icon in your browser toolbar.

### Step 2: Click Network Dropdown

At the top of MetaMask, you'll see the current network (probably "Ethereum Mainnet"). Click on it.

### Step 3: Add Network

1. Scroll down and click **"Add Network"** or **"Add a network manually"**
2. If you see "Hardhat Local" in the list, just click it and you're done!

### Step 4: Enter Network Details

If you need to add it manually, fill in:

- **Network Name**: `Hardhat Local`
- **New RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`
- **Block Explorer URL**: (leave empty)

### Step 5: Save and Switch

1. Click **"Save"** or **"Add Network"**
2. MetaMask will automatically switch to the new network

### Step 6: Verify

- Network dropdown should show **"Hardhat Local"**
- You should see your account with ETH balance
- Refresh your browser page
- The error should be gone!

## Important: Hardhat Node Must Be Running

⚠️ **Make sure Hardhat node is running:**

```bash
npm run node
```

Keep this terminal open! The network won't work without it.

## Quick Summary

1. ✅ Hardhat node running: `npm run node`
2. ✅ Add Hardhat network in MetaMask (or let it auto-add)
3. ✅ Switch to Hardhat Local network
4. ✅ Refresh browser page

That's it! The error will be fixed.

