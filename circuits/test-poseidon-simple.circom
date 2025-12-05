pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

template TestPoseidon() {
    signal input left;
    signal input right;
    signal output hash;
    
    component hasher = Poseidon(2);
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;
    hash <== hasher.out;
}

component main = TestPoseidon();


