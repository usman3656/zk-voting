pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";
template VoteVerification(levels) {
    signal input proposalId;
    signal input merkleRoot;
    signal input nullifier;
    signal input numCandidates;
    signal private input voterSecret;
    signal private input candidateIndex;
    signal private input pathElements[levels];
    signal private input pathIndices[levels];
    component hashers[levels];
    signal intermediate[levels + 1];
    intermediate[0] <== voterSecret;
    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        signal leftInput;
        signal rightInput;
        leftInput <== intermediate[i] * (1 - pathIndices[i]) + pathElements[i] * pathIndices[i];
        rightInput <== pathElements[i] * (1 - pathIndices[i]) + intermediate[i] * pathIndices[i];
        hashers[i].inputs[0] <== leftInput;
        hashers[i].inputs[1] <== rightInput;
        intermediate[i + 1] <== hashers[i].out;
    }
    intermediate[levels] === merkleRoot;
    component lessThan = LessThan(32);
    lessThan.in[0] <== candidateIndex;
    lessThan.in[1] <== numCandidates;
    lessThan.out === 1;
    component nullifierHash = Poseidon(2);
    nullifierHash.inputs[0] <== voterSecret;
    nullifierHash.inputs[1] <== proposalId;
    nullifierHash.out === nullifier;
}
component main = VoteVerification(20);


