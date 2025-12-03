# 🗳️ Advanced Voting System

A decentralized voting system built with Solidity smart contracts and React frontend, featuring candidate-based and yes/no voting types with proposal-specific voter management.

## Features

- ✅ **Two Voting Types**:
  - **Candidate-Based**: Vote for one candidate from multiple options
  - **Yes/No**: Vote yes or no on a proposal

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

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Start Hardhat Node

Open **Terminal 1** and run:

```bash
npm run node
```

**Keep this terminal running!** You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### 3. Deploy Contract and Setup

Open **Terminal 2** (new terminal) and run:

```bash
npm run setup
```

This will:
- Deploy the SimpleVoting contract
- Update `frontend/.env` with the contract address
- Create `frontend/public/hardhat-accounts.json` with test accounts

### 4. Start Frontend

Open **Terminal 3** (new terminal) and run:

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 5. Connect MetaMask

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

## Test Accounts

The system provides 5 pre-funded test accounts:

| Account | Address | Role | Balance |
|---------|---------|------|---------|
| 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | 👑 Owner | 10000 ETH |
| 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 👤 Voter | 10000 ETH |
| 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 👤 Voter | 10000 ETH |
| 4 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 👤 Voter | 10000 ETH |
| 5 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | 👤 Voter | 10000 ETH |

**Note**: Private keys are displayed on the frontend (owner-only view). Account 1 is the contract owner.

## Usage

### As Owner

1. **Create Proposals**:
   - Candidate-Based: Create a proposal with multiple candidates
   - Yes/No: Create a yes/no question proposal

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
2. **Vote**: Select a candidate or vote yes/no
3. **View Results**: After owner finishes voting, view the results

## Scripts

### Root Directory

- `npm run node` - Start Hardhat local blockchain
- `npm run setup` - Deploy contract and setup frontend (requires node running)
- `npm run deploy:host` - Deploy contract only (requires node running)
- `npm run compile` - Compile smart contracts
- `npm run test` - Run test suite

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
1. Make sure Hardhat node is running
2. Run `npm run setup` again
3. Restart frontend dev server (Vite caches env vars)

**Problem**: "Internal JSON-RPC error"  
**Solution**: 
- Make sure you're on Hardhat network (Chain ID: 31337)
- Redeploy the contract using `npm run setup`
- Clear browser cache and reload

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

1. **Candidate-Based Voting**:
   - Multiple candidates
   - One vote per eligible voter
   - Winner is candidate with most votes
   - Ties are automatically detected

2. **Yes/No Voting**:
   - Binary choice
   - Counts yes and no votes separately
   - Results show percentage breakdown

### Owner Functions

- `createCandidateProposal()` - Create candidate-based proposal
- `createYesNoProposal()` - Create yes/no proposal
- `addVoterToProposal()` - Add single voter to a proposal
- `addVotersToProposal()` - Add multiple voters to a proposal
- `finishVoting()` - End voting and finalize results

### Voter Functions

- `voteForCandidate()` - Vote for a candidate
- `voteYesNo()` - Vote yes or no

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
