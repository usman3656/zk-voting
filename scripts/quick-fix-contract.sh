#!/bin/bash

# Quick fix script for contract deployment error
# This redeploys the contract and updates the frontend .env

echo "🔧 Quick Fix: Redeploying Contract and Updating Frontend"
echo "========================================================="
echo ""

# Check if Hardhat node is running (basic check)
echo "📋 Step 1: Checking Hardhat node..."
if curl -s http://127.0.0.1:8545 > /dev/null 2>&1; then
    echo "   ✅ Hardhat node is running"
else
    echo "   ⚠️  Warning: Hardhat node doesn't seem to be running"
    echo "   Please start it first: npm run node"
    exit 1
fi

echo ""
echo "📋 Step 2: Deploying contract..."
DEPLOY_OUTPUT=$(npm run deploy:host 2>&1)
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -oP "SimpleVoting deployed to: \K(0x[a-fA-F0-9]{40})")

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "   ❌ Failed to get contract address from deployment"
    echo "$DEPLOY_OUTPUT"
    exit 1
fi

echo "   ✅ Contract deployed to: $CONTRACT_ADDRESS"

echo ""
echo "📋 Step 3: Updating frontend/.env..."
cd frontend || exit 1
echo "VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" > .env
echo "   ✅ Updated frontend/.env with new contract address"

echo ""
echo "========================================================="
echo "✅ Quick Fix Complete!"
echo ""
echo "📝 Next steps:"
echo "   1. If frontend dev server is running, restart it"
echo "   2. Refresh your browser (Ctrl+Shift+R)"
echo "   3. The error should be fixed!"
echo ""
echo "Contract Address: $CONTRACT_ADDRESS"
echo "========================================================="

