# Error Fix Summary

## The Problem

You're getting "Internal JSON-RPC error" when trying to create a candidate proposal. This happens because:

**The contract deployed at `0x8A791620dd6260079BF849Dc5567aDC3F2FdC318` is the OLD version** and doesn't have the new functions like `createCandidateProposal`.

## The Solution

You need to **redeploy the contract** with the new code that includes all the advanced features.

## Step-by-Step Fix

### 1. Make sure Hardhat node is running

```bash
npx hardhat node
```

Keep this terminal open and running.

### 2. Deploy the updated contract

Open a **new terminal** and run:

```bash
npm run deploy:host
```

This will:
- Deploy the new contract with all advanced features
- Print the new contract address
- Copy the address (it will look like `0x...`)

### 3. Update frontend environment

Edit `frontend/.env` and update the contract address:

```
VITE_CONTRACT_ADDRESS=0x... (paste the new address here)
```

### 4. Restart the frontend

**Important**: Vite caches environment variables, so you MUST restart the dev server:

1. Stop the frontend dev server (Ctrl+C)
2. Start it again:
   ```bash
   cd frontend
   npm run dev
   ```

### 5. Test

Now try creating a candidate proposal again. It should work!

## Verify Contract Version

To check if your contract has the new functions, you can run:

```bash
CONTRACT_ADDRESS=0x... npx hardhat run scripts/test-contract-functions.ts
```

Replace `0x...` with your contract address.

## Common Issues

### "Only owner can create proposals"

Make sure you're using the **owner account** in MetaMask. The owner is the account that deployed the contract (usually the first Hardhat account).

### "Contract not found"

- Make sure Hardhat node is running
- Check the contract address in `frontend/.env`
- Make sure you're on the Hardhat network in MetaMask (Chain ID: 31337)

### Still getting errors after redeploying

1. Clear browser cache
2. Hard refresh the page (Ctrl+Shift+R)
3. Check browser console for detailed error messages
4. Make sure the frontend was restarted after updating `.env`

## Quick Checklist

- [ ] Hardhat node is running
- [ ] Contract deployed with new code
- [ ] `frontend/.env` updated with new contract address
- [ ] Frontend dev server restarted
- [ ] Using owner account in MetaMask
- [ ] On Hardhat network (Chain ID: 31337)

## Need More Help?

Check the browser console for detailed error messages. The improved error handling should now show clearer messages about what's wrong.

