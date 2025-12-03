# Simple Voting System - Frontend

A clean and simple React TypeScript frontend for the SimpleVoting smart contract with MetaMask integration.

## Features

- ✅ MetaMask wallet connection
- ✅ View all proposals
- ✅ Vote on proposals (if registered)
- ✅ Admin panel for owner (create proposals, register voters)
- ✅ Real-time data refresh
- ✅ Error handling
- ✅ Clean, simple UI

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Contract Address

Create a `.env` file in the frontend directory:

```bash
cp .env.example .env
```

Update `.env` with your deployed contract address:

```
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Connect MetaMask**: Click "Connect Wallet" button
2. **Switch Network**: Make sure you're on the correct network (Chain ID: 31337 for Hardhat)
3. **As Owner**: 
   - Create proposals
   - Register voters
4. **As Voter**:
   - View all proposals
   - Vote on proposals
5. **As Public**:
   - View all proposals (read-only)

## Network Configuration

The app is configured for:
- **Hardhat/Localhost**: Chain ID 31337

Make sure your MetaMask is connected to the same network as your deployed contract.

## Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Troubleshooting

### MetaMask Not Found
- Install MetaMask browser extension
- Make sure it's enabled

### Wrong Network
- Switch MetaMask to the correct network (Chain ID: 31337)
- Or add the network manually in MetaMask

### Contract Not Found
- Check that `VITE_CONTRACT_ADDRESS` is set correctly in `.env`
- Verify the contract is deployed on the current network

### Transaction Fails
- Make sure you have enough ETH for gas
- Check that you're using the correct network
- Verify your account has the required permissions (owner/voter)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── WalletButton.tsx   # Wallet connection
│   │   ├── ProposalCard.tsx   # Proposal display
│   │   └── AdminPanel.tsx     # Admin functions
│   ├── hooks/
│   │   ├── useWallet.ts       # Wallet connection hook
│   │   └── useVoting.ts       # Contract interaction hook
│   ├── config/
│   │   └── contract.ts        # Contract ABI and config
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Entry point
└── package.json
```
