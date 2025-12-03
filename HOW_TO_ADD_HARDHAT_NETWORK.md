# 🔧 How to Add Hardhat Network to MetaMask

## Quick Method (Automatic)

The frontend now tries to automatically switch/add the Hardhat network. Just connect your wallet and approve the network addition when MetaMask prompts you.

## Manual Method

If automatic switching doesn't work, follow these steps:

### Step 1: Open MetaMask

Click the MetaMask extension icon in your browser.

### Step 2: Open Network Settings

1. Click the network dropdown at the top (currently shows "Ethereum Mainnet" or similar)
2. Click "Add Network" or "Add a network manually" at the bottom

### Step 3: Enter Network Details

Fill in these exact values:

- **Network Name**: `Hardhat Local`
- **New RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`
- **Block Explorer URL**: (leave empty)

### Step 4: Save

Click "Save" or "Add Network"

### Step 5: Switch to the Network

1. Click the network dropdown again
2. Select "Hardhat Local"

## Verify It's Working

After switching:
- Network dropdown should show "Hardhat Local"
- You should see your account with ETH balance
- The frontend should connect successfully

## Troubleshooting

### "This network already exists"
- The network is already added
- Just switch to it from the network dropdown

### "Failed to fetch"
- Make sure Hardhat node is running: `npm run node`
- Check the RPC URL is exactly: `http://127.0.0.1:8545`

### Can't see the network
- Refresh MetaMask
- Try disconnecting and reconnecting your wallet in the frontend

## Network Details Summary

```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

## Important Notes

⚠️ **The Hardhat node MUST be running** for this network to work!

Start it with:
```bash
npm run node
```

Keep this terminal open while using the frontend.

