# Simple Voting System - Quick Start Guide

## 📋 Overview

This is a simple voting system built with Solidity and Hardhat. It allows:
- **Owner** to register voters and create proposals
- **Registered voters** to cast votes on proposals
- **Anyone** to view voting results

## 🏗️ What We Built

### Contract: `SimpleVoting.sol`

**Key Features:**
1. **Voter Registration**: Owner can register eligible voters
2. **Proposal Creation**: Owner can create voting proposals
3. **Voting**: Registered voters can cast one vote per proposal
4. **Results**: Anyone can view vote counts and proposal details

**Main Functions:**
- `registerVoter(address)` - Register a single voter
- `registerVoters(address[])` - Register multiple voters at once
- `createProposal(string)` - Create a new voting proposal
- `vote(uint256)` - Cast a vote for a proposal
- `getVoteCount(uint256)` - Get vote count for a proposal
- `getProposal(uint256)` - Get full proposal details
- `checkVoteStatus(uint256, address)` - Check if someone voted

## 🚀 How to Use

### Step 1: Compile the Contract

```bash
cd zk-voting-system
npm run compile
```

This compiles your Solidity contract and checks for errors.

### Step 2: Run Tests

```bash
npm test
```

This runs all the tests to verify everything works correctly. You should see:
- ✅ Deployment tests
- ✅ Voter registration tests
- ✅ Proposal creation tests
- ✅ Voting functionality tests
- ✅ Results tracking tests

### Step 3: Deploy Locally

**Option A: Deploy to Hardhat's built-in network**
```bash
npm run deploy:local
```

**Option B: Start a local node and deploy**
```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy (in a new terminal)
npx hardhat run scripts/deploy-voting.ts --network localhost
```

### Step 4: Interact with the Contract

You can interact with the deployed contract using:
- Hardhat console: `npx hardhat console --network localhost`
- Write custom scripts in `scripts/` folder
- Build a frontend (see next section)

## 📝 Example Usage Flow

1. **Deploy the contract** → Owner is set to deployer
2. **Register voters** → Owner calls `registerVoters([address1, address2, ...])`
3. **Create proposals** → Owner calls `createProposal("Should we do X?")`
4. **Voters vote** → Each voter calls `vote(proposalId)`
5. **Check results** → Anyone calls `getVoteCount(proposalId)`

## 🎨 Next Steps: Building a Frontend

To make it user-friendly, you can build a simple web interface:

### Option 1: Simple HTML/JavaScript
- Use ethers.js to connect to MetaMask
- Display proposals and vote counts
- Allow registered voters to vote

### Option 2: React/Next.js Frontend
- More professional UI
- Better user experience
- Can integrate with wallet connections

### Option 3: Use Existing Tools
- **Remix IDE**: Deploy and interact via web interface
- **Hardhat Console**: Command-line interaction

## 🔧 Understanding the Code

### Contract Structure

```solidity
contract SimpleVoting {
    // State variables
    address public owner;                    // Contract owner
    mapping(address => bool) public isRegisteredVoter;  // Voter registry
    mapping(uint256 => Proposal) public proposals;      // Proposals storage
    mapping(uint256 => mapping(address => bool)) public hasVoted;  // Vote tracking
    
    // Functions
    registerVoter()      // Owner only
    createProposal()     // Owner only
    vote()               // Registered voters only
    getVoteCount()       // Public view
}
```

### Security Features

1. **Access Control**: Only owner can register voters and create proposals
2. **Voter Verification**: Only registered voters can vote
3. **Double Voting Prevention**: Each voter can vote only once per proposal
4. **Input Validation**: Checks for valid addresses and existing proposals

## 🧪 Testing

The test file (`test/SimpleVoting.test.ts`) covers:
- ✅ Contract deployment
- ✅ Voter registration (single and multiple)
- ✅ Proposal creation
- ✅ Voting functionality
- ✅ Double voting prevention
- ✅ Access control
- ✅ Results tracking

Run tests with: `npm test`

## 📚 Key Concepts Explained

### 1. **Mappings**
```solidity
mapping(address => bool) public isRegisteredVoter;
```
- Like a dictionary/hash table
- Maps addresses to boolean values
- Used to check if someone is a registered voter

### 2. **Structs**
```solidity
struct Proposal {
    uint256 id;
    string description;
    uint256 voteCount;
    bool exists;
}
```
- Custom data type to group related data
- Stores proposal information

### 3. **Modifiers**
```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Only owner...");
    _;
}
```
- Reusable code that runs before functions
- Used for access control

### 4. **Events**
```solidity
event VoteCast(address indexed voter, uint256 indexed proposalId);
```
- Log important actions on the blockchain
- Can be listened to by frontends
- Indexed parameters make filtering easier

## 🐛 Common Issues & Solutions

### Issue: "Only owner can perform this action"
**Solution**: Make sure you're calling from the owner account (deployer)

### Issue: "You are not a registered voter"
**Solution**: Owner must register the voter first using `registerVoter()`

### Issue: "You have already voted"
**Solution**: Each voter can only vote once per proposal

### Issue: "Proposal does not exist"
**Solution**: Check the proposal ID exists (starts at 1, not 0)

## 🎯 Future Enhancements

Once you're comfortable with this simple version, you can add:

1. **Voting Deadlines**: Add time limits for proposals
2. **Multiple Choice**: Allow voting for multiple options
3. **Weighted Voting**: Give some voters more weight
4. **Anonymous Voting**: Integrate zero-knowledge proofs (ZK)
5. **Proposal Categories**: Organize proposals by type
6. **Vote Delegation**: Allow voters to delegate their votes
7. **Results Visualization**: Better frontend for viewing results

## 📖 Learning Resources

- **Solidity Docs**: https://docs.soliditylang.org/
- **Hardhat Docs**: https://hardhat.org/docs
- **Ethers.js Docs**: https://docs.ethers.org/
- **OpenZeppelin**: https://docs.openzeppelin.com/contracts/

## ✅ Checklist

- [ ] Contract compiled successfully
- [ ] All tests passing
- [ ] Contract deployed locally
- [ ] Understood how to register voters
- [ ] Understood how to create proposals
- [ ] Understood how voting works
- [ ] Ready to build frontend or add features!

---

**Happy Voting! 🗳️**

If you have questions or want to add features, feel free to ask!

