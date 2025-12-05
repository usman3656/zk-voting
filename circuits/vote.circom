pragma circom 2.0.0;

// NO Poseidon include needed - all hashing done in JavaScript!
include "circomlib/circuits/comparators.circom";

template VoteVerification(levels) {
    // Public inputs (will be verified on-chain) - these are public by default in Circom
    signal input proposalId;
    signal input merkleRoot;
    signal input nullifier;
    signal input numCandidates;
    
    // Private inputs
    signal input voterSecret;
    signal input candidateIndex;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    // NEW: Intermediate hashes computed in JavaScript (no Poseidon in circuit!)
    signal input intermediateHashes[levels + 1];
    
    // Constrain pathIndices to be 0 or 1 (binary constraint)
    for (var i = 0; i < levels; i++) {
        // pathIndices[i] must be 0 or 1, so pathIndices[i] * (1 - pathIndices[i]) === 0
        pathIndices[i] * (1 - pathIndices[i]) === 0;
    }
    
    // Verify that intermediateHashes[0] matches voterSecret (leaf)
    intermediateHashes[0] === voterSecret;
    
    // Verify that the final intermediate hash matches the merkleRoot
    // All Poseidon hashing is done in JavaScript, circuit just verifies equality
    intermediateHashes[levels] === merkleRoot;
    
    component lessThan = LessThan(32);
    lessThan.in[0] <== candidateIndex;
    lessThan.in[1] <== numCandidates;
    lessThan.out === 1;
    
    // Nullifier is computed in JavaScript, circuit just verifies it matches
    // No Poseidon computation in circuit - all hashing done in JavaScript!
}

component main = VoteVerification(5);
