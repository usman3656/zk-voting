# Circuit Compilation Issue - Windows Fix

## Problem
The circuit compilation is failing with a parse error on Windows. The error shows:
```
Error: Parse error on line 1:
pragma circom 2.0.0;include "circ
```

This appears to be a Windows-specific issue with how circom reads files.

## Solutions

### Option 1: Use WSL (Windows Subsystem for Linux)
If you have WSL installed:
```bash
wsl
cd /mnt/d/"Old Data"/masters/"Term 1"/project/109/zk-voting
npm run zk:compile
```

### Option 2: Install circom via Rust (Recommended)
```bash
# Install Rust if not already installed
# Download from: https://rustup.rs/

# Install circom via cargo
cargo install --git https://github.com/iden3/circom.git --tag v2.1.7

# Then compile
circom circuits/vote.circom --r1cs --wasm --sym -o circuits/build
```

### Option 3: Use Docker
```bash
# Create a Dockerfile or use existing circom image
docker run -v ${PWD}:/workspace -w /workspace iden3/circom:latest circom circuits/vote.circom --r1cs --wasm --sym -o circuits/build
```

### Option 4: Manual File Fix
Try recreating the circuit file with explicit UTF-8 encoding:
```bash
# Delete and recreate
rm circuits/vote.circom
# Then manually create it with a text editor that saves as UTF-8 without BOM
```

### Option 5: Use Online Compiler
You can use an online Circom compiler or compile on a Linux machine, then copy the build files.

## Temporary Workaround
For now, you can:
1. Skip circuit compilation and use a pre-compiled circuit
2. Compile on a Linux machine or WSL
3. Use the Docker approach

The rest of the ZK voting system will work once you have the compiled circuit files (`vote.wasm` and `vote_final.zkey`).


