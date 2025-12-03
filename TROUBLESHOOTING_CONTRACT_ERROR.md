# 🔧 Troubleshooting: "could not decode result data" Error

## Error Message
```
Error: could not decode result data (value="0x", info={ "method": "proposalCount", "signature": "proposalCount()" })
```

## What This Error Means

This error occurs when the frontend tries to call a contract method, but **the contract doesn't exist at that address**. The `value="0x"` means there's no code at that address.

## Common Causes

### 1. Hardhat Node Was Restarted ⚠️ **MOST COMMON**

**Problem:** When you restart the Hardhat node, it resets the blockchain. All deployed contracts are lost.

**Solution:**
1. Stop the frontend dev server
2. Redeploy the contract:
   ```bash
   npm run deploy:host
   ```
3. Update `frontend/.env` with the new contract address
4. Restart the frontend dev server

### 2. Wrong Contract Address

**Problem:** The contract address in `frontend/.env` doesn't match the deployed contract.

**Solution:**
1. Check the contract address from deployment:
   ```bash
   npm run deploy:host
   ```
   Look for: `SimpleVoting deployed to: 0x...`

2. Update `frontend/.env`:
   ```
   VITE_CONTRACT_ADDRESS=0x... (your actual address)
   ```

3. Restart the frontend dev server (Vite requires restart for .env changes)

### 3. Network Mismatch

**Problem:** MetaMask is connected to a different network than where the contract is deployed.

**Solution:**
- Check that MetaMask is on "Hardhat Local" network (Chain ID: 31337)
- Verify Hardhat node is running on `http://127.0.0.1:8545`

### 4. Contract Never Deployed

**Problem:** You configured the frontend with an address, but never deployed the contract.

**Solution:**
1. Make sure Hardhat node is running: `npm run node`
2. Deploy the contract: `npm run deploy:host`
3. Copy the contract address to `frontend/.env`
4. Restart frontend

## Step-by-Step Fix

### Quick Fix (If Hardhat Node Was Restarted)

1. **Get the new contract address:**
   ```bash
   npm run deploy:host
   ```
   
   Output should show:
   ```
   SimpleVoting deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   ```

2. **Update frontend/.env:**
   ```bash
   cd frontend
   echo "VITE_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" > .env
   ```
   (Replace with your actual address)

3. **Restart frontend:**
   - Stop the dev server (Ctrl+C)
   - Start it again: `npm run dev`

4. **Refresh browser:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear cache and reload

### Complete Reset (If Nothing Works)

1. **Stop everything:**
   - Stop Hardhat node (Ctrl+C)
   - Stop frontend (Ctrl+C)

2. **Restart Hardhat node:**
   ```bash
   npm run node
   ```

3. **In a new terminal, deploy contract:**
   ```bash
   npm run deploy:host
   ```

4. **Update frontend/.env with new address**

5. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Connect MetaMask and test**

## Verification Steps

### Check Contract Exists

You can verify the contract exists using a test script:

```bash
npx hardhat run scripts/test-full-flow.ts --network localhost
```

If this works, the contract exists. If it fails, the contract doesn't exist.

### Check Frontend Configuration

1. **Verify .env file exists:**
   ```bash
   cat frontend/.env
   ```
   Should show: `VITE_CONTRACT_ADDRESS=0x...`

2. **Check contract address matches:**
   ```bash
   npm run deploy:host | grep "deployed to"
   ```
   Compare with the address in `.env`

### Check Network

1. Open browser console (F12)
2. Check the "Initializing contract..." log
3. Verify the contract address matches
4. Check network is correct (Chain ID: 31337)

## Prevention Tips

1. **Keep Hardhat node running:** Don't restart it unless necessary
2. **Save contract address:** Keep the deployment output handy
3. **Use consistent workflow:**
   - Start node first
   - Deploy contract
   - Update .env
   - Start frontend
   - Test

## Better Error Handling

I've added better error handling to the frontend that will:
- Check if contract exists before calling methods
- Show clear error messages
- Help identify the exact problem

After the fix, you should see clearer error messages like:
- "No contract found at address... Please redeploy the contract."
- "Contract address not configured..."

## Still Having Issues?

1. **Check browser console (F12):**
   - Look for detailed error messages
   - Check network requests
   - Verify contract address

2. **Check Hardhat node terminal:**
   - Make sure it's running
   - Check for errors
   - Verify RPC is working

3. **Verify configuration:**
   - Contract address in .env
   - Network in MetaMask
   - Hardhat node running

4. **Try complete reset:**
   - Follow "Complete Reset" steps above
   - Start fresh

## Summary

**Most likely cause:** Hardhat node was restarted → contract no longer exists → need to redeploy

**Quick fix:**
1. `npm run deploy:host` (get new address)
2. Update `frontend/.env` with new address
3. Restart frontend dev server
4. Refresh browser

