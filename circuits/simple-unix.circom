pragma circom 2.0.0;

template SimpleTest() {
    signal input x;
    signal output y;
    y <== x * 2;
}

component main = SimpleTest();

