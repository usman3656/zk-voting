#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================================="
echo "🚀 AUTOMATED SETUP: Starting Hardhat Node + Deployment"
echo "=========================================================="
echo ""

# Step 1: Start Hardhat node in background
echo -e "${BLUE}Step 1: Starting Hardhat node...${NC}"
npx hardhat node > /tmp/hardhat-node.log 2>&1 &
NODE_PID=$!

echo "Hardhat node starting (PID: $NODE_PID)"
echo "Waiting for node to be ready..."

# Wait for node to start (check for "Started HTTP" in logs)
timeout=30
counter=0
while [ $counter -lt $timeout ]; do
    if grep -q "Started HTTP" /tmp/hardhat-node.log 2>/dev/null; then
        echo -e "${GREEN}✅ Hardhat node is ready!${NC}"
        sleep 2  # Give it a moment to fully initialize
        break
    fi
    sleep 1
    counter=$((counter + 1))
    echo -n "."
done

if [ $counter -eq $timeout ]; then
    echo -e "\n${RED}❌ Hardhat node did not start in time${NC}"
    kill $NODE_PID 2>/dev/null
    exit 1
fi

echo ""

# Step 2: Deploy contract
echo -e "${BLUE}Step 2: Deploying contract...${NC}"
DEPLOY_OUTPUT=$(npm run deploy:host 2>&1)
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "SimpleVoting deployed to:" | sed 's/.*deployed to: //' | tr -d '\n\r ')

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo -e "${RED}❌ Failed to deploy contract${NC}"
    echo "$DEPLOY_OUTPUT"
    kill $NODE_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Contract deployed to: $CONTRACT_ADDRESS${NC}"

# Step 3: Update frontend .env
echo -e "${BLUE}Step 3: Updating frontend/.env...${NC}"
FRONTEND_ENV="frontend/.env"
echo "VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" > "$FRONTEND_ENV"
echo -e "${GREEN}✅ Updated frontend/.env${NC}"

# Step 4: Create accounts JSON file
echo -e "${BLUE}Step 4: Creating accounts file...${NC}"
cat > frontend/public/hardhat-accounts.json << 'EOF'
{
  "accounts": [
    {
      "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "privateKey": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      "balance": "10000 ETH",
      "role": "Owner (Contract Owner)",
      "isOwner": true
    },
    {
      "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "privateKey": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      "balance": "10000 ETH",
      "role": "Voter",
      "isOwner": false
    },
    {
      "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "privateKey": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
      "balance": "10000 ETH",
      "role": "Voter",
      "isOwner": false
    },
    {
      "address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "privateKey": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
      "balance": "10000 ETH",
      "role": "Voter",
      "isOwner": false
    },
    {
      "address": "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      "privateKey": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
      "balance": "10000 ETH",
      "role": "Voter",
      "isOwner": false
    }
  ],
  "network": {
    "name": "Hardhat Local",
    "chainId": 31337,
    "rpcUrl": "http://127.0.0.1:8545"
  }
}
EOF

# Update with contract address
TEMP_FILE=$(mktemp)
jq --arg addr "$CONTRACT_ADDRESS" '.contractAddress = $addr' frontend/public/hardhat-accounts.json > "$TEMP_FILE" 2>/dev/null || \
  node -e "const fs=require('fs');const d=JSON.parse(fs.readFileSync('frontend/public/hardhat-accounts.json'));d.contractAddress='$CONTRACT_ADDRESS';fs.writeFileSync('frontend/public/hardhat-accounts.json',JSON.stringify(d,null,2))"
mv "$TEMP_FILE" frontend/public/hardhat-accounts.json

echo -e "${GREEN}✅ Created accounts file${NC}"

echo ""
echo "=========================================================="
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo "=========================================================="
echo ""
echo "📝 Summary:"
echo "   • Hardhat node running (PID: $NODE_PID)"
echo "   • Contract deployed to: $CONTRACT_ADDRESS"
echo "   • Frontend .env updated"
echo "   • Accounts saved to frontend/public/hardhat-accounts.json"
echo ""
echo "👤 Owner Account (Account 1):"
echo "   Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo -e "${YELLOW}⚠️  Keep this terminal running! Press Ctrl+C to stop.${NC}"
echo ""
echo "🌐 Next steps:"
echo "   1. Start frontend: cd frontend && npm run dev"
echo "   2. Open browser - accounts will be displayed on frontend"
echo "   3. Import Account 1 private key into MetaMask (Owner)"
echo "   4. Switch MetaMask to Hardhat Local network (Chain ID: 31337)"
echo ""

# Trap Ctrl+C to cleanup
trap "echo ''; echo '🛑 Shutting down Hardhat node...'; kill $NODE_PID 2>/dev/null; exit 0" INT

# Keep script running
wait $NODE_PID

