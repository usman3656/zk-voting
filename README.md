

# 🗳️ Advanced Voting System

A decentralized voting system built with Solidity smart contracts and React frontend, featuring candidate-based voting with proposal-specific voter management.

## Features

- ✅ **Candidate-Based Voting**: Vote for one candidate from multiple options

- ✅ **Proposal-Specific Voters**: Owner can define different voter bases for each proposal
- ✅ **Owner Controls**: Finish voting, view results, manage voters
- ✅ **Tie Detection**: Automatically detects and displays ties
- ✅ **Secure**: Only contract owner can see account addresses and private keys
- ✅ **Modern UI**: Clean React frontend with MetaMask integration

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MetaMask browser extension
- Git

## Quick Start

Choose one of the following options based on your needs:

- **Option A: Local Development (Hardhat)** - Fast setup, no testnet ETH needed, perfect for development
- **Option B: Testnet Deployment** - Deploy to public testnets (Sepolia, Goerli, Holesky) for testing with real blockchain

Both options automatically configure the frontend and are ready to use!

---

### Option A: Local Development (Hardhat) 🏠

Perfect for local development and testing. No testnet ETH needed!

#### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 2. Start Hardhat Node

Open **Terminal 1** and run:

```bash
npm run node
```

**Keep this terminal running!** You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

#### 3. Deploy Contract and Setup

Open **Terminal 2** (new terminal) and run:

```bash
npm run setup
```

This automatically:
- ✅ Deploys the SimpleVoting contract
- ✅ Updates `frontend/.env` with the contract address
- ✅ Creates `frontend/public/hardhat-accounts.json` with test accounts

#### 4. Start Frontend

Open **Terminal 3** (new terminal) and run:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### 5. Connect MetaMask

1. Open MetaMask
2. Add Hardhat Network:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

3. Import Owner Account:
   - Click account icon → Import Account
   - Select "Private Key"
   - Use Account 1's private key (shown on frontend after setup)

---

### Option B: Testnet Deployment (Sepolia, Goerli, Holesky) 🌐

Deploy to public testnets for real blockchain testing!

#### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

#### 2. Configure Environment Variables

Create a `.env` file in the **root directory** (same folder as `package.json`):

```bash
# For Sepolia testnet (recommended)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/Your_infura_key
SEPOLIA_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# For Goerli testnet (optional)
GOERLI_RPC_URL=https://rpc.ankr.com/eth_goerli
GOERLI_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# For Holesky testnet (optional)
HOLESKY_RPC_URL=https://rpc.holesky.ethpandaops.io
HOLESKY_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

**Important Security Notes:**
- ⚠️ Never commit your `.env` file to version control
- ⚠️ Never share your private keys
- ⚠️ Use a dedicated testnet account, not your main account
- ⚠️ Private key should start with `0x`

**Getting Your Private Key:**
- Open MetaMask → Click account icon → Account details → Show private key
- Or generate a new wallet for testing

**Getting an RPC URL:**
- **Public RPC** (free, may be rate-limited): `https://rpc.sepolia.org`
- **Infura** (more reliable): Sign up at https://www.infura.io/ and get your RPC URL
- **Alchemy** (also reliable): Sign up at https://www.alchemy.com/ and get your RPC URL

#### 3. Get Testnet ETH

You'll need testnet ETH to deploy and interact with the contract:

- **Sepolia**: [Sepolia Faucet](https://sepoliafaucet.com/) | [Infura Faucet](https://www.infura.io/faucet/sepolia) | [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)
- **Goerli**: [Goerli Faucet](https://goerlifaucet.com/)
- **Holesky**: [Holesky Faucet](https://holesky-faucet.pk910.de/)

#### 4. Deploy to Testnet

Use the automated setup script (recommended):

```bash
# Deploy to Sepolia (recommended)
npm run setup:sepolia

# Deploy to Goerli
npm run setup:goerli

# Deploy to Holesky
npm run setup:holesky
```

Or use the manual deploy command:

```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Deploy to Goerli
npm run deploy:goerli

# Deploy to Holesky
npm run deploy:holesky
```

**The setup script automatically:**
- ✅ Checks your environment variables
- ✅ Deploys the SimpleVoting contract to the testnet
- ✅ Updates `frontend/.env` with the contract address and network name
- ✅ Shows the contract address and block explorer link

#### 5. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

#### 6. Connect MetaMask

1. Open MetaMask
2. Switch to the testnet network (Sepolia, Goerli, or Holesky)
3. Make sure you're using an account with testnet ETH
4. The frontend will automatically detect and switch to the correct network if needed

## Test Accounts (Local Development Only)

For **local Hardhat development**, the system provides 5 pre-funded test accounts:

| Account | Address | Role | Balance |
|---------|---------|------|---------|
| 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 👑 Owner | 10000 ETH |
| 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 👤 Voter | 10000 ETH |
| 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 👤 Voter | 10000 ETH |
| 4 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 👤 Voter | 10000 ETH |
| 5 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | 👤 Voter | 10000 ETH |

**Note**: 
- Private keys are displayed on the frontend (owner-only view) for local development
- Account 1 is the contract owner
- These accounts are only available for local Hardhat network
- For testnet, use your own MetaMask accounts with testnet ETH

## Usage

### As Owner

1. **Create Proposals**:
   - Candidate-Based: Create a proposal with multiple candidates

2. **Add Voters to Proposals**:
   - For each proposal, add specific addresses that can vote
   - Each proposal can have a different set of eligible voters

3. **View Accounts** (Owner Only):
   - See all test accounts and private keys on the dashboard
   - Useful for importing accounts into MetaMask

4. **Finish Voting**:
   - Once voting is complete, finish the proposal
   - Results will be displayed automatically

### As Voter

1. **Connect Wallet**: Connect with an account that has voting permission
2. **Vote**: Select a candidate from the available options
3. **View Results**: After owner finishes voting, view the results

## Scripts

### Root Directory

**Local Development (Hardhat):**
- `npm run node` - Start Hardhat local blockchain
- `npm run setup` - **Automated setup**: Deploy contract and configure frontend (requires node running)
- `npm run deploy:host` - Deploy contract only to localhost (requires node running)
- `npm run deploy:local` - Deploy to Hardhat network

**Testnet Deployment:**
- `npm run setup:sepolia` - **Automated setup**: Deploy to Sepolia and configure frontend
- `npm run setup:goerli` - **Automated setup**: Deploy to Goerli and configure frontend
- `npm run setup:holesky` - **Automated setup**: Deploy to Holesky and configure frontend
- `npm run deploy:sepolia` - Deploy to Sepolia testnet (manual)
- `npm run deploy:goerli` - Deploy to Goerli testnet (manual)
- `npm run deploy:holesky` - Deploy to Holesky testnet (manual)

**Other:**
- `npm run compile` - Compile smart contracts
- `npm run test` - Run test suite

> **💡 Tip**: Use the `setup:*` commands for automated deployment and frontend configuration. They handle everything automatically!

### Frontend Directory

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
zk-voting/
├── contracts/
│   └── SimpleVoting.sol          # Main voting contract
├── scripts/
│   ├── deploy-voting.ts          # Contract deployment script
│   ├── setup-and-deploy.ts       # Automated setup script
│   └── register-voters.ts        # Register voters script
├── test/
│   └── SimpleVoting.test.ts      # Contract tests
├── frontend/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom React hooks
│   │   └── config/               # Configuration
│   └── public/
│       └── hardhat-accounts.json # Test accounts (auto-generated)
└── README.md
```

## Troubleshooting

### Hardhat Node Issues

**Problem**: Port 8545 already in use  
**Solution**: Stop any existing Hardhat node processes or change port in `hardhat.config.ts`

**Problem**: "Hardhat node did not start in time"  
**Solution**: Wait a few seconds after starting the node before running setup

### Contract Deployment Issues

**Problem**: "No contract found at address"  
**Solution**: 
1. **For local**: 
   - Make sure Hardhat node is running
   - Run `npm run setup` again
   - Restart frontend dev server (Vite caches env vars)
2. **For testnet**: 
   - Verify the contract address in `frontend/.env` matches the deployed address
   - Check that `VITE_NETWORK` in `frontend/.env` matches your testnet (sepolia, goerli, or holesky)
   - Make sure you're on the correct network in MetaMask
   - Restart frontend dev server (Vite caches env vars)

**Problem**: "Internal JSON-RPC error"  
**Solution**: 
- For local: Make sure you're on Hardhat network (Chain ID: 31337)
- For testnet: Verify you're on the correct testnet network
- Redeploy the contract if needed
- Clear browser cache and reload

**Problem**: "Deployer account has no balance" (Testnet)  
**Solution**: 
- Get testnet ETH from a faucet (see "Get Testnet ETH" section above)
- Verify your private key is correct in the `.env` file
- Check that you have enough ETH for gas fees

**Problem**: "Wrong network detected"  
**Solution**: 
- The frontend will automatically try to switch networks
- If automatic switching fails, manually switch MetaMask to the correct network
- Verify `VITE_NETWORK` in `frontend/.env` matches your deployment network

### Frontend Issues

**Problem**: Accounts not showing  
**Solution**: 
- Make sure you ran `npm run setup` after starting the node
- Check that `frontend/public/hardhat-accounts.json` exists
- Refresh the browser page
- Only owner account can see the accounts section

**Problem**: Can't create proposals  
**Solution**:
- Make sure you're connected with Account 1 (Owner)
- Verify you're on Hardhat network (Chain ID: 31337)
- Check browser console for errors

**Problem**: Wrong network error  
**Solution**:
- Add Hardhat network to MetaMask (see "Connect MetaMask" section)
- Switch to Hardhat Local network
- Refresh the page

### MetaMask Issues

**Problem**: Transactions failing  
**Solution**:
- Make sure you're on Hardhat network
- Check that you have ETH (accounts start with 10000 ETH)
- Verify the contract address in `frontend/.env` matches the deployed contract

## Development

### Running Tests

```bash
npm run test
```

### Compiling Contracts

```bash
npm run compile
```

### Building Frontend

```bash
cd frontend
npm run build
```

## Security Notes

- ⚠️ **Private keys are only visible to the contract owner** on the frontend
- ⚠️ These are test accounts for local development only
- ⚠️ Never use these private keys on mainnet or public networks
- ⚠️ Always use secure wallets for production deployments

## Contract Features

### Voting Types

**Candidate-Based Voting**:
   - Multiple candidates
   - One vote per eligible voter
   - Winner is candidate with most votes
   - Ties are automatically detected

### Owner Functions

- `createCandidateProposal()` - Create candidate-based proposal
- `addVoterToProposal()` - Add single voter to a proposal
- `addVotersToProposal()` - Add multiple voters to a proposal
- `finishVoting()` - End voting and finalize results

### Voter Functions

- `voteForCandidate()` - Vote for a candidate

## License

ISC

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

Built with ❤️ using Hardhat, Solidity, React, and TypeScript
