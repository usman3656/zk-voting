pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";

template TestPoseidon() {
    signal input x;
    signal output y;
    component hash = Poseidon(1);
    hash.inputs[0] <== x;
    y <== hash.out;
}

component main = TestPoseidon();


