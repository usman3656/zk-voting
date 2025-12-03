# 🧪 Complete Testing Guide

This guide will help you test the entire zk-voting system locally, step by step.

## Prerequisites

- Node.js installed
- MetaMask browser extension installed
- All dependencies installed (`npm install` in root and `frontend` directories)

## Step 1: Start Hardhat Node

Open a terminal and start the Hardhat node:

```bash
npm run node
```

This will start a local blockchain network on `http://127.0.0.1:8545` with 20 test accounts pre-funded with ETH.

**Keep this terminal open!** The node must be running for everything to work.

You should see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

## Step 2: Deploy the Contract

In a **new terminal** (keep the node running), deploy the contract:

```bash
npm run deploy:host
```

You should see:
```
Deploying SimpleVoting contract...
SimpleVoting deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Deployment successful!
```

**Save the contract address!** You'll need it for the frontend.

## Step 3: Configure Frontend

Update the frontend `.env` file with the deployed contract address:

1. Navigate to the `frontend` directory
2. Create or update `.env` file:
   ```
   VITE_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
   ```
   (Replace with your actual deployed address)

## Step 4: Set Up MetaMask

### 4.1 Import Owner Account into MetaMask

The owner account is the first Hardhat account with address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

**To import:**

1. Open MetaMask
2. Click the account icon (circle) at top right
3. Select "Import Account"
4. Choose "Private Key"
5. Enter this private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
6. Click "Import"

### 4.2 Add Hardhat Network to MetaMask

1. Open MetaMask settings
2. Go to "Networks"
3. Click "Add Network" → "Add a network manually"
4. Enter these details:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
5. Click "Save"
6. Switch to this network in MetaMask

## Step 5: Start Frontend

In a **new terminal**, navigate to the frontend directory and start the dev server:

```bash
cd frontend
npm run dev
```

The frontend should start at `http://localhost:5173`

## Step 6: Connect Wallet

1. Open `http://localhost:5173` in your browser
2. Click "Connect Wallet" button
3. MetaMask will prompt you to connect
4. Select your imported owner account
5. Approve the connection

**Expected Result:** 
- Wallet should connect successfully
- You should see "👑 Owner" status in the dashboard
- If you see "👤 Not Registered", you need to register yourself as a voter (see Step 7)

## Step 7: Register Owner as Voter

**Important:** The owner is NOT automatically registered as a voter. You must register yourself.

1. In the frontend, you should see an "Admin Panel" section (only visible to owners)
2. In the "Register Single Voter" section:
   - Enter your owner address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Click "Register Voter"
3. MetaMask will prompt for transaction confirmation
4. Approve the transaction

**Expected Result:**
- Transaction completes successfully
- Status should update to show you're registered
- "Registered Voters" count should increase to 1

## Step 8: Create a Proposal

1. Scroll to the "Create Proposal" section
2. Enter a description, e.g., "Should we implement feature X?"
3. Click "Create Proposal"
4. Approve the MetaMask transaction

**Expected Result:**
- Proposal is created successfully
- It appears in the "All Proposals" list
- Total Proposals count increases

## Step 9: Vote on Proposal

1. Find your created proposal in the list
2. Click the "Vote" button
3. Approve the MetaMask transaction

**Expected Result:**
- Vote is cast successfully
- Vote count on the proposal increases
- "Already Voted" status appears

## Step 10: Test with Multiple Accounts

To test with different voter accounts:

### Register Additional Voter

1. Import another Hardhat account into MetaMask (account #2):
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
   - Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

2. As the owner (account #1), register this new account:
   - Use Admin Panel → Register Single Voter
   - Enter: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

3. Switch MetaMask to account #2

4. Connect wallet again in the frontend

**Expected Result:**
- Status shows "✓ Voter" (not owner)
- Can vote on proposals
- Cannot create proposals or register voters

## Troubleshooting

### Issue: "Contract address not configured"

**Solution:**
- Make sure `.env` file exists in `frontend/` directory
- Verify `VITE_CONTRACT_ADDRESS` is set correctly
- Restart the frontend dev server after changing `.env`

### Issue: "Owner status not detected"

**Possible Causes:**
1. Wrong account connected - Make sure you're using the owner account
2. Wrong network - Switch to Hardhat Local (Chain ID: 31337)
3. Contract address mismatch - Verify `.env` has correct address

**Solution:**
- Check browser console (F12) for error messages
- Verify account address matches the owner address from deployment
- Verify network chain ID is 31337

### Issue: "Cannot register as voter"

**Solution:**
- Make sure you're connected as the owner account
- Check that the Hardhat node is still running
- Verify you have enough ETH (shouldn't be an issue on Hardhat)

### Issue: "Transaction fails"

**Common Causes:**
1. Insufficient gas (shouldn't happen on Hardhat)
2. Wrong network
3. Account doesn't have permissions

**Solution:**
- Check MetaMask error message
- Verify you're on the correct network (Chain ID: 31337)
- Check browser console for detailed error

### Issue: Frontend shows "Loading..." forever

**Solution:**
- Open browser console (F12) and check for errors
- Verify contract address in `.env` is correct
- Make sure Hardhat node is running
- Check that account is connected

### Issue: "RPC Error" or connection errors

**Solution:**
- Make sure Hardhat node is running (`npm run node`)
- Verify RPC URL in MetaMask is `http://127.0.0.1:8545`
- Try refreshing the page

## Automated Testing

Run the automated test script to verify everything works:

```bash
npx hardhat run scripts/test-full-flow.ts --network localhost
```

This will:
- ✅ Check contract deployment
- ✅ Verify owner status
- ✅ Register owner as voter
- ✅ Create a test proposal
- ✅ Vote on the proposal
- ✅ Display final status

## Testing Checklist

- [ ] Hardhat node is running
- [ ] Contract is deployed
- [ ] Frontend `.env` is configured
- [ ] MetaMask has owner account imported
- [ ] MetaMask is connected to Hardhat network
- [ ] Frontend connects wallet successfully
- [ ] Owner status is detected
- [ ] Owner can register as voter
- [ ] Owner can create proposals
- [ ] Owner can vote on proposals
- [ ] Additional voters can be registered
- [ ] Registered voters can vote
- [ ] Non-registered users cannot vote

## Browser Console Debugging

Open browser console (F12) to see detailed logs:

- ✅ "Initializing contract..." - Contract is being set up
- ✅ "Loading contract data..." - Data is being fetched
- ✅ "Loaded contract state" - Shows current state
- ✅ "Owner check" - Shows owner verification
- ✅ "Voter registration" - Shows voter status

If you see errors, check:
1. Contract address is set
2. Network is correct
3. Account is connected

## Next Steps

Once everything is working:

1. **Create multiple proposals** to test the full voting system
2. **Register multiple voters** to test with different accounts
3. **Test edge cases** like:
   - Voting twice (should fail)
   - Non-owner trying to create proposal (should fail)
   - Non-registered voter trying to vote (should fail)

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check terminal output for contract errors
3. Verify all steps in this guide
4. Check `HOW_TO_BECOME_OWNER_OR_VOTER.md` for account setup details

