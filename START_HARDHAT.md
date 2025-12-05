# Starting Hardhat Node for Local Development

## Quick Start

### Step 1: Start Hardhat Node

Open a **new terminal** and run:

```bash
cd "d:\Old Data\masters\Term 1\project\109\zk-voting"
npm run node
```

**Keep this terminal open!** You should see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Step 2: Deploy Contracts (if not already deployed)

In a **second terminal**, run:

```bash
cd "d:\Old Data\masters\Term 1\project\109\zk-voting"
npm run zk:deploy
```

This will deploy:
- ZKVotingVerifier contract
- SimpleVoting contract

### Step 3: Verify Hardhat is Running

You can test if Hardhat is responding by running:

```bash
curl -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://127.0.0.1:8545
```

If it returns a JSON response with a block number, Hardhat is working!

### Step 4: Configure MetaMask

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter:
   - **Network Name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. Click "Save"

### Step 5: Import Owner Account

1. In MetaMask, click account icon → "Import Account"
2. Select "Private Key"
3. Enter: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. Click "Import"

### Step 6: Switch to Hardhat Network

In MetaMask, select "Hardhat Local" network.

### Step 7: Refresh Frontend

Refresh your browser. The frontend should now connect successfully!

## Troubleshooting

### "Cannot connect to server"
- Make sure Hardhat node is running (Step 1)
- Check that port 8545 is not blocked by firewall
- Try restarting Hardhat node

### "RPC endpoint returned too many errors"
- Restart Hardhat node
- Make sure only one Hardhat node is running
- Check MetaMask is connected to Hardhat Local network

### "Contract not found"
- Run `npm run zk:deploy` to deploy contracts
- Check `frontend/.env` has correct `VITE_CONTRACT_ADDRESS`

## Important Notes

- **Keep the Hardhat node terminal running** while using the frontend
- If you restart Hardhat node, you'll need to redeploy contracts
- Hardhat node resets on restart (all transactions are lost)


