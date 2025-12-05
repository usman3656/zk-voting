# 🔐 How to Use ZK Voting

## Overview

ZK (Zero-Knowledge) voting allows voters to cast votes **anonymously** without revealing their identity or choice until after voting ends. Here's how it works:

### Key Differences from Regular Voting:

1. **Anonymous**: Your vote and identity are hidden using cryptographic proofs
2. **Private**: No one can see who voted for which candidate during voting
3. **Verifiable**: After voting ends, votes can be revealed and tallied
4. **Double-vote Prevention**: Uses nullifiers to prevent voting twice

## Step-by-Step Guide

### For Owners: Creating a ZK Proposal

1. **Connect as Owner**: Make sure you're connected with the owner account
2. **Create ZK Proposal**: 
   - Scroll to the "🔐 Create ZK Anonymous Proposal" section
   - Enter proposal description
   - Add candidates (at least 2)
   - Enter eligible voter addresses (one per line)
   - **IMPORTANT**: The Merkle tree is generated automatically when you create the proposal
   - The tree root is stored on-chain, but addresses stay private
3. **Save Voter Secrets**: 
   - After creating the proposal, you'll see the voter secrets
   - **CRITICAL**: Save these secrets! You must share them with voters
   - Each voter needs their specific secret to cast a ZK vote
4. **Note**: You **CANNOT** add voters to a ZK proposal after creation. The voter list is fixed when the proposal is created via the Merkle tree.

### For Voters: Voting with ZK

1. **Get Your Secret**: 
   - The owner should provide you with your voter secret
   - This is generated when the Merkle tree is created
   - It's specific to your address and the proposal
2. **Connect Wallet**: Connect with the address that was added to the proposal
3. **Select Candidate**: Choose which candidate to vote for
4. **Generate Proof**: 
   - Click "Vote with ZK Proof"
   - This generates a zero-knowledge proof (takes 10-30 seconds)
   - The proof proves you're eligible without revealing your identity
5. **Submit Vote**: The proof is verified on-chain and your vote is recorded anonymously

## What Makes It Private?

### Regular Voting:
- ❌ Your address is visible on-chain
- ❌ Your vote choice is visible
- ❌ Anyone can see who voted for whom

### ZK Voting:
- ✅ Your address is NOT linked to your vote
- ✅ Your vote choice is hidden (stored as commitment)
- ✅ Only a nullifier (unique ID) is visible, not your identity
- ✅ After voting ends, owner reveals votes for tallying

## Technical Details

### How It Works:

1. **Merkle Tree**: Creates a tree of eligible voters' secrets
2. **ZK Proof**: Proves you're in the tree without revealing which leaf
3. **Nullifier**: Prevents double-voting (unique per voter+proposal)
4. **Commitment**: Stores vote as hash(vote + secret) until reveal
5. **Reveal**: After voting ends, owner reveals and tallies votes

### Security:

- **Eligibility**: Proof verifies you're in the Merkle tree
- **Anonymity**: No link between your address and vote
- **Integrity**: Can't vote twice (nullifier check)
- **Verifiability**: Proof is verified on-chain

## Current Status

✅ **Implemented:**
- ZK proposal creation UI
- Merkle tree generation
- ZK proof generation
- Anonymous vote submission
- Nullifier-based double-vote prevention

⚠️ **Note**: The full end-to-end flow requires:
1. Owner creates ZK proposal with voter addresses
2. Owner shares voter secrets with voters
3. Voters use secrets to generate proofs and vote
4. After voting ends, owner reveals votes (manual process for now)

## Troubleshooting

**"Voter credentials not found"**
- You need your voter secret from the proposal owner
- Make sure you're using the address that was added to the proposal

**"Merkle proof not available"**
- Contact the proposal owner to get your voting credentials
- The owner should have generated these when creating the proposal

**"Invalid ZK proof"**
- Make sure you're using the correct secret for your address
- Verify the proposal ID and Merkle root match

