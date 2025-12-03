# 🚀 Quick Start Guide: Becoming Owner or Voter

## 📝 Simple Summary

**Owner** = The person who deploys the contract  
**Registered Voter** = Someone the owner adds to the voting list

---

## 👑 How to Become the Owner

**Step 1: Deploy the contract**
```bash
npm run deploy:local
```

**That's it!** The address that deploys automatically becomes the owner.

You'll see output like:
```
SimpleVoting deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  ← This is YOU!
```

---

## 🗳️ How to Become a Registered Voter

### Method 1: Using the Frontend (Easiest! ✨)

1. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Connect MetaMask with the OWNER account**

3. **Copy the address you want to register:**
   - Open MetaMask
   - Click your account name
   - Copy the address (starts with `0x...`)

4. **Register the voter:**
   - In the Admin Panel section
   - Paste the address in "Register Single Voter"
   - Click "Register Voter"
   - ✅ Done!

5. **Switch MetaMask to that account:**
   - You'll now see "✓ Voter" status
   - You can vote!

### Method 2: Using the Script

**Step 1: Start Hardhat node (if not running)**
```bash
npm run node
```

**Step 2: Deploy contract**
```bash
npm run deploy:host
```
Copy the contract address from the output.

**Step 3: Register voters**
```bash
npx hardhat run scripts/register-voters.ts --network localhost <CONTRACT_ADDRESS>
```

Or register specific addresses:
```bash
npx hardhat run scripts/register-voters.ts --network localhost <CONTRACT_ADDRESS> "0xAddress1,0xAddress2,0xAddress3"
```

---

## 🎯 Complete Example: Setup from Scratch

### Step 1: Deploy Contract (Become Owner)
```bash
npm run deploy:local
```

**Output:**
```
SimpleVoting deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Save the contract address!** You'll need it.

### Step 2: Setup Frontend
```bash
cd frontend
echo "VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3" > .env
# Replace with YOUR contract address
npm run dev
```

### Step 3: Connect as Owner
- Open `http://localhost:5173`
- Connect MetaMask
- You should see "👑 Owner" status

### Step 4: Register Voters
- In Admin Panel, register voter addresses
- You can register your own address to test voting
- Register multiple addresses if needed

### Step 5: Test Voting
- Switch MetaMask to a registered voter account
- You should see "✓ Voter" status
- Create a proposal (as owner)
- Vote on it (as voter)!

---

## 💡 Pro Tips

### Tip 1: Register Yourself as Voter
As the owner, you can register your own address:
- Copy your MetaMask address
- Register it in the Admin Panel
- Now you're both owner AND voter!

### Tip 2: Use Multiple MetaMask Accounts
1. Create multiple accounts in MetaMask
2. Copy each address
3. Register all of them as voters
4. Switch between accounts to test voting

### Tip 3: Check Your Status
- **Owner**: Dashboard shows "👑 Owner"
- **Voter**: Dashboard shows "✓ Voter"
- **Not Registered**: Dashboard shows "Not Registered"

---

## 📋 Quick Reference Table

| What You Want | What To Do |
|--------------|------------|
| **Be Owner** | Deploy contract: `npm run deploy:local` |
| **Be Voter** | Have owner register your address via frontend |
| **Register Others** | Use Admin Panel if you're owner |
| **Check Status** | Look at dashboard "Your Status" card |

---

## ❓ Common Questions

**Q: I deployed the contract, but I don't see owner status?**  
A: Make sure you're connecting MetaMask with the same address that deployed the contract.

**Q: How do I know which address deployed?**  
A: Check the deployment output - it shows the owner address.

**Q: Can I be both owner and voter?**  
A: Yes! As owner, register your own address as a voter.

**Q: I'm owner but can't vote?**  
A: Owner must also be registered as a voter to vote. Register yourself first!

**Q: How do I get my wallet address?**  
A: In MetaMask, click your account name and copy the address (starts with `0x`).

---

## 🎉 That's It!

Now you know how to:
- ✅ Become the owner (deploy contract)
- ✅ Become a registered voter (get registered by owner)
- ✅ Register others (if you're owner)

**Start with deployment, then use the frontend to manage everything!** 🚀

For more details, see `HOW_TO_BECOME_OWNER_OR_VOTER.md`

