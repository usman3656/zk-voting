# Troubleshooting: Contract Errors

## Error: "Internal JSON-RPC error" when creating proposals

This error typically means one of the following:

### 1. Contract needs to be redeployed

**Problem**: The contract at the deployed address doesn't have the new functions (`createCandidateProposal`, `createYesNoProposal`, etc.)

**Solution**:
1. Make sure Hardhat node is running: `npx hardhat node`
2. Deploy the updated contract:
   ```bash
   npm run deploy:host
   ```
3. Copy the new contract address
4. Update `frontend/.env` with the new address:
   ```
   VITE_CONTRACT_ADDRESS=0x... (new address)
   ```
5. Restart the frontend dev server (Vite caches env vars)

### 2. Not using the owner account

**Problem**: Only the contract owner can create proposals.

**Solution**:
1. Make sure you're using the owner account in MetaMask
2. The owner is the account that deployed the contract
3. Check which account is the owner by looking at the deployment script output

### 3. Check contract version

Run this script to check if your contract has the new functions:

```bash
CONTRACT_ADDRESS=0x... npx hardhat run scripts/test-contract-functions.ts
```

Replace `0x...` with your contract address.

## Error on page load

If you see errors when the page loads, it might be:

1. **Contract doesn't exist**: Make sure the contract is deployed
2. **Wrong network**: Make sure you're on Hardhat network (Chain ID: 31337)
3. **Wrong contract address**: Check `frontend/.env` file

## How to verify

1. **Check contract address**: Look at `frontend/.env` - is it correct?
2. **Check network**: Open MetaMask - are you on "Hardhat Local" network?
3. **Check contract**: Run the test script above to see what functions exist
4. **Check owner**: Make sure you're using the owner account

## Quick fix

If you just want to test with a fresh contract:

```bash
# 1. Start Hardhat node
npx hardhat node

# 2. In another terminal, deploy
npm run deploy:host

# 3. Copy the contract address and update frontend/.env
# Edit frontend/.env and set VITE_CONTRACT_ADDRESS=... (new address)

# 4. Restart frontend
cd frontend
npm run dev
```

