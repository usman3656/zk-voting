#!/bin/bash

# Full automated setup script
# Starts Hardhat node, deploys contract, updates env, shows accounts

echo "=========================================================="
echo "🚀 AUTOMATED SETUP: Starting Everything"
echo "=========================================================="
echo ""

# Check if Hardhat node is already running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Hardhat node already running on port 8545"
    echo "   Using existing node..."
    NODE_PID=""
else
    # Start Hardhat node in background
    echo "Step 1: Starting Hardhat node..."
    npx hardhat node > /tmp/hardhat-node.log 2>&1 &
    NODE_PID=$!
    echo "Hardhat node starting (PID: $NODE_PID)"
    
    # Wait for node to be ready
    echo "Waiting for node to be ready..."
    timeout=30
    counter=0
    while [ $counter -lt $timeout ]; do
        if grep -q "Started HTTP" /tmp/hardhat-node.log 2>/dev/null; then
            echo "✅ Hardhat node is ready!"
            sleep 2
            break
        fi
        sleep 1
        counter=$((counter + 1))
        echo -n "."
    done
    
    if [ $counter -eq $timeout ]; then
        echo ""
        echo "❌ Hardhat node did not start in time"
        exit 1
    fi
fi

echo ""

# Step 2: Deploy and setup
echo "Step 2: Deploying contract and setting up..."
npm run setup

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    if [ ! -z "$NODE_PID" ]; then
        kill $NODE_PID 2>/dev/null
    fi
    exit 0
}

trap cleanup INT TERM

# Keep running
echo ""
echo "✅ Setup complete! Hardhat node is running."
echo "   Press Ctrl+C to stop the node."
wait

