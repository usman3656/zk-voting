# 🔐 Zero-Knowledge Voting - Simplified Implementation Plan

## 🎯 Goal
Implement a simple ZK voting system that balances speed and privacy, adding one feature at a time.

## 📋 Implementation Strategy

**Approach:** Incremental - One feature at a time, test thoroughly before moving to next
**Trusted Setup:** Public ceremony (Perpetual Powers of Tau) - easiest and acceptable
**Proof Generation:** Client-side (browser) - proper privacy, standard approach
**Privacy vs Speed:** Balanced - optimize circuit for reasonable speed while maintaining privacy

---

## 🚀 Phase 1: Basic Anonymous Voting (MVP)

### Goal
Hide voter identity and vote choice while preventing double-voting.

### What We'll Build

**Feature:** Anonymous vote submission with nullifier-based double-vote prevention

**How It Works:**
1. Voter generates ZK proof that:
   - They are eligible (in Merkle tree of voters)
   - They voted for a valid candidate
   - They haven't voted before (nullifier check)
2. Submit proof + nullifier to contract
3. Contract verifies proof and stores nullifier
4. Vote choice is hidden, only nullifier is public

### Technical Stack
- **ZK Library:** Circom + snarkjs (already in dependencies)
- **Trusted Setup:** Public ceremony (Perpetual Powers of Tau)
- **Proof Generation:** Client-side (browser)
- **Circuit:** Simple vote verification circuit

### Implementation Steps

#### Step 1.1: Create Basic ZK Circuit (Week 1)
**File:** `circuits/vote.circom`

**Circuit Logic:**
```
Inputs (Private):
  - voterSecret: Secret that identifies voter
  - merklePath: Merkle proof path
  - candidateIndex: Which candidate (0, 1, 2, ...)
  - proposalId: Proposal ID

Outputs (Public):
  - nullifier: hash(voterSecret, proposalId) - prevents double voting
  - proposalId: Public proposal ID
  - merkleRoot: Root of voter eligibility tree

Constraints:
  1. Verify Merkle proof (voter is eligible)
  2. Verify candidate index is valid
  3. Generate nullifier
  4. Verify proposal exists
```

**Deliverable:** Working Circom circuit that compiles

---

#### Step 1.2: Trusted Setup (Week 1)
**Process:**
1. Use public Perpetual Powers of Tau ceremony
2. Generate circuit-specific setup
3. Create proving key and verification key

**Commands:**
```bash
# Download trusted setup
# Generate circuit-specific setup
# Create keys
```

**Deliverable:** Proving key and verification key files

---

#### Step 1.3: Smart Contract - Verifier (Week 1-2)
**File:** `contracts/ZKVotingVerifier.sol` (generated from circuit)

**What It Does:**
- Verifies ZK-SNARK proofs
- Checks proof validity
- Returns true/false

**Deliverable:** Verifier contract that can verify proofs

---

#### Step 1.4: Smart Contract - ZK Voting Functions (Week 2)
**File:** `contracts/SimpleVoting.sol` (additions)

**New Functions:**
```solidity
// Merkle tree management
function setVoterMerkleRoot(uint256 proposalId, bytes32 root) // Owner only

// ZK vote submission
function voteWithZK(
    uint256 proposalId,
    uint256[8] calldata proof,  // ZK proof
    bytes32 nullifier            // Prevents double voting
) external

// Nullifier tracking
mapping(uint256 => mapping(bytes32 => bool)) public usedNullifiers;
mapping(uint256 => bytes32) public proposalMerkleRoots;
```

**Deliverable:** Contract can accept and verify ZK votes

---

#### Step 1.5: Frontend - Proof Generation (Week 2-3)
**Files:** 
- `frontend/src/utils/zkVoting.ts` - ZK utilities
- `frontend/src/components/ZKVoting.tsx` - ZK voting component

**What It Does:**
1. Generate Merkle proof for voter
2. Create ZK proof (using snarkjs)
3. Submit proof to contract
4. Show progress during proof generation

**Deliverable:** Frontend can generate and submit ZK votes

---

#### Step 1.6: Frontend - Vote Tallying (Week 3)
**Challenge:** How to count votes if they're anonymous?

**Solution:** Store encrypted votes, decrypt after voting ends

**For MVP:** Start simpler - store vote commitments (hash of vote + secret)
- Owner can reveal votes after voting ends
- Or: Use homomorphic encryption (more complex)

**Simpler MVP Approach:**
- Store nullifiers + encrypted vote data
- Owner decrypts and tallies after voting ends
- Results are verifiable (can check all nullifiers were valid)

**Deliverable:** Vote counting system that works with anonymous votes

---

### Phase 1 Deliverables Checklist

- [ ] Circom circuit compiles and works
- [ ] Trusted setup complete (public ceremony)
- [ ] Verifier contract deployed and tested
- [ ] Smart contract accepts ZK votes
- [ ] Frontend generates ZK proofs
- [ ] Frontend submits votes successfully
- [ ] Double-voting prevented (nullifier system)
- [ ] Vote counting works
- [ ] Basic UI for ZK voting

### Phase 1 Success Criteria
✅ Votes are anonymous (cannot see who voted for what)
✅ Double-voting prevented
✅ Eligible voters only
✅ Results can be tallied
✅ Proof generation < 30 seconds
✅ Gas cost < 500k per vote

---

## 🔄 Phase 2: Encrypted Vote Storage (Next Feature)

**Only start after Phase 1 is fully working and tested!**

### Goal
Add encrypted vote storage for additional privacy layer.

### What We'll Add
- Encrypt vote before storing on-chain
- Decrypt only after voting period ends
- Owner can decrypt and tally

### Implementation
- Add encryption/decryption utilities
- Store encrypted votes on-chain
- Add decryption function (owner only)
- Update tally system

---

## 🔄 Phase 3: Verifiable Tally (Future)

**Only start after Phase 2 is working!**

### Goal
Prove tally is correct without revealing individual votes.

### What We'll Add
- ZK proof that all votes were counted correctly
- Public verification of results

---

## 📁 Project Structure (After Phase 1)

```
zk-voting/
├── circuits/
│   ├── vote.circom              # ZK circuit definition
│   ├── build/                   # Compiled circuit
│   ├── proving_key.json         # For generating proofs
│   └── verification_key.json    # For verifying proofs
├── contracts/
│   ├── SimpleVoting.sol         # Main contract (updated)
│   └── ZKVotingVerifier.sol     # Generated verifier
├── scripts/
│   ├── setup-zk.ts              # ZK setup script
│   └── generate-merkle.ts       # Generate voter Merkle tree
├── frontend/
│   └── src/
│       ├── utils/
│       │   └── zkVoting.ts      # ZK proof generation
│       └── components/
│           └── ZKVoting.tsx     # ZK voting UI
└── ZK_IMPLEMENTATION_PLAN.md    # This file
```

---

## 🛠️ Technical Details - Phase 1

### ZK Circuit Specification

**Circuit Name:** `VoteVerification`

**Private Inputs:**
- `voterSecret` (field) - Secret that identifies voter uniquely
- `merklePath` (array) - Merkle proof path for eligibility
- `candidateIndex` (field) - Index of chosen candidate (0-based)
- `proposalId` (field) - Proposal ID

**Public Inputs:**
- `nullifier` (field) - hash(voterSecret, proposalId)
- `proposalId` (field) - Public proposal ID
- `merkleRoot` (field) - Root of voter eligibility tree

**Constraints:**
1. Verify Merkle proof: `verifyMerkleProof(voterSecret, merklePath, merkleRoot)`
2. Verify candidate: `0 <= candidateIndex < numCandidates`
3. Generate nullifier: `nullifier = hash(voterSecret, proposalId)`

### Smart Contract Changes

**New State Variables:**
```solidity
// Merkle roots for each proposal
mapping(uint256 => bytes32) public proposalMerkleRoots;

// Track used nullifiers (prevents double voting)
mapping(uint256 => mapping(bytes32 => bool)) public usedNullifiers;

// Encrypted votes (for Phase 2)
mapping(uint256 => EncryptedVote[]) public encryptedVotes;

// ZK Verifier contract
IVerifier public zkVerifier;
```

**New Functions:**
```solidity
// Set Merkle root for proposal (owner only)
function setVoterMerkleRoot(uint256 proposalId, bytes32 merkleRoot)

// Submit ZK vote
function voteWithZK(
    uint256 proposalId,
    uint256[8] calldata proof,
    bytes32 nullifier,
    bytes calldata encryptedVote  // For Phase 2
)

// Check if nullifier used
function isNullifierUsed(uint256 proposalId, bytes32 nullifier) view returns (bool)
```

### Frontend Implementation

**ZK Utilities (`zkVoting.ts`):**
```typescript
// Generate ZK proof
async function generateVoteProof(
  voterSecret: string,
  merkleProof: MerkleProof,
  candidateIndex: number,
  proposalId: bigint
): Promise<Proof>

// Submit ZK vote
async function submitZKVote(
  proposalId: bigint,
  proof: Proof,
  nullifier: string
): Promise<void>
```

**UI Component:**
- Show proof generation progress
- Display "Vote submitted anonymously"
- Hide vote choice from UI after submission

---

## ⚙️ Setup & Configuration

### Dependencies Needed

**Already Have:**
- ✅ `circomlib` - Circom standard library
- ✅ `circomlibjs` - JavaScript bindings
- ✅ `snarkjs` - ZK-SNARK library

**May Need to Add:**
- `circom` - Circuit compiler (CLI tool)
- `circom_runtime` - Runtime for circuits

### Environment Setup

```bash
# Install Circom compiler
npm install -g circom

# Or use npx
npx circom --version

# Install snarkjs (already have)
npm install snarkjs
```

---

## 🧪 Testing Strategy

### Unit Tests
- Test circuit compilation
- Test proof generation
- Test proof verification
- Test nullifier uniqueness

### Integration Tests
- Test full vote flow
- Test double-voting prevention
- Test vote counting
- Test Merkle tree verification

### Manual Testing
- Test proof generation time
- Test gas costs
- Test user experience
- Test on testnet

---

## 📊 Expected Results - Phase 1

### Privacy
- ✅ Voter identity hidden
- ✅ Vote choice hidden
- ✅ Cannot link vote to voter
- ✅ Nullifier prevents double-voting without revealing identity

### Performance
- Proof generation: 10-30 seconds (acceptable)
- Gas cost: 300-500k gas per vote (reasonable)
- Verification: < 100k gas (on-chain)

### User Experience
- Clear progress during proof generation
- Simple voting interface
- Confirmation of anonymous vote submission

---

## 🚦 Next Steps

1. **Start with Step 1.1:** Create basic Circom circuit
2. **Test thoroughly** before moving to next step
3. **Get feedback** after each step
4. **Iterate** based on results

---

## ❓ Questions Before Starting

1. **Vote Storage:** For Phase 1 MVP, should we:
   - Option A: Store encrypted votes (more complex, more private)
   - Option B: Store vote commitments only, reveal after voting ends (simpler)
   - **Recommendation:** Option B for MVP, add encryption in Phase 2

2. **Merkle Tree Generation:** Who generates the Merkle tree?
   - Owner generates it when adding voters?
   - Or separate script?
   - **Recommendation:** Owner generates when creating proposal

3. **Voter Secrets:** How do voters get their secrets?
   - Generated from their address deterministically?
   - Owner provides them?
   - **Recommendation:** Deterministic from address + proposal (simpler)

4. **Backward Compatibility:** Should we:
   - Add new voting type `ZK_CANDIDATE_BASED`?
   - Or replace existing voting?
   - **Recommendation:** Add new type, keep old system working

---

## 🎯 Ready to Start?

Once you confirm the approach, I'll begin with:
1. Creating the basic Circom circuit
2. Setting up the development environment
3. Implementing Step 1.1

**Let me know if you want any changes to this plan!** 🚀

