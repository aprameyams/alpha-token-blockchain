# Complete Deployment Guide - Days 3-7

**Total Timeline:** 4 days (Days 3-7, excluding Day 2)  
**Total Cost:** $0 (free tier)  
**Effort:** ~3-4 hours total (mostly waiting for automation)

---

# 📅 DAY 3: Create Accounts & Push to GitHub

## ⏱️ Time Required: 30 minutes

### Step 1: Create GitHub Account (5 min)

1. Go to **https://github.com/signup**
2. Enter:
   - **Username:** `alpha-token-blockchain` (or your choice)
   - **Email:** `aprameyams2001@gmail.com`
   - **Password:** Strong password (save it!)
3. Verify email
4. Complete setup (accept defaults)

### Step 2: Create New Repository (5 min)

1. After signup, you'll see "Create a repository" button
2. Click it and fill in:
   - **Repository name:** `alpha-token-blockchain`
   - **Description:** "ALPHA TOKEN blockchain MVP - instant consensus, production-ready"
   - **Visibility:** Public
   - **Initialize:** Leave unchecked (we'll push existing code)
3. Click **"Create repository"**

**You'll see:** A URL like `https://github.com/YOUR_USERNAME/alpha-token-blockchain`  
**Save this URL!** (You'll need it next)

### Step 3: Push Your Blockchain Code to GitHub (20 min)

Open PowerShell in your blockchain folder:

```bash
cd c:\Users\ad\Downloads\blockchain

# Configure Git with your GitHub account
git config --global user.name "YOUR_USERNAME"
git config --global user.email "aprameyams2001@gmail.com"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "ALPHA TOKEN MVP - Day 1 Build - Instant Consensus Blockchain"

# Add GitHub remote (replace YOUR_USERNAME with your actual username)
git remote add origin https://github.com/YOUR_USERNAME/alpha-token-blockchain.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**What happens:**
- First time: You'll be prompted to login with GitHub
- Then: All your code uploads to GitHub
- Takes 1-2 minutes depending on internet speed

**Verify:** Open your GitHub repo URL in browser. You should see all files!

---

# 🚀 DAY 4: Deploy to Render.com

## ⏱️ Time Required: 45 minutes

### Step 1: Create Render.com Account (5 min)

1. Go to **https://render.com**
2. Click **"Sign Up"** (top right)
3. Click **"Sign up with GitHub"**
4. Authorize GitHub access
5. Account created! ✅

### Step 2: Deploy Your Blockchain (30 min)

#### 2A: Create Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Under "Connect a repository," search for `alpha-token-blockchain`
3. Click **"Connect"**

#### 2B: Configure Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `alpha-token-blockchain` |
| **Environment** | `Node` |
| **Region** | `Oregon (US West)` (or closest to you) |
| **Branch** | `main` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run node` |
| **Runtime** | `node-16` |

#### 2C: Add Environment Variables

Click **"Add Environment Variable"** and add:

```
API_PORT = 3000
NODE_ENV = production
DATA_PATH = /var/data/blockchain
```

#### 2D: Select Plan

**⚠️ IMPORTANT:** Make sure you select the **FREE** plan (green badge)

- Free tier features:
  - 0.5 CPU, 512 MB RAM
  - Perfect for 100+ users
  - Auto-sleeps after 15 min inactivity (wakes on request)
  - No credit card needed

#### 2E: Click Deploy

Click **"Create Web Service"** button.

**What happens next:**
- Render starts building (takes 2-3 minutes)
- You'll see logs scrolling
- When done: **Green checkmark** appears
- Service is LIVE! 🎉

**Wait for:** "Your service is live" message

### Step 3: Get Your Public URL (5 min)

1. Find your service name in Render Dashboard
2. Look for the **URL** (looks like):
   ```
   https://alpha-token-blockchain.onrender.com
   ```
3. **Copy and save this URL!** (You'll share this with 100 users)

### Step 4: Verify Deployment (5 min)

Test your live blockchain:

```bash
# Test health check
curl https://alpha-token-blockchain.onrender.com/health

# Should return:
# {"status":"ok","timestamp":...}

# Test wallet generation
curl https://alpha-token-blockchain.onrender.com/crypto/keygen

# Should return wallet with address, keys
```

✅ **If both work:** Your blockchain is LIVE! 🚀

---

# 📊 DAY 5-6: Load Testing & Monitoring

## ⏱️ Time Required: 4-6 hours (spread across 2 days)

### Preparation: Create Test Script

Save this as `test-load.sh` (or `.ps1` for Windows):

```bash
#!/bin/bash

API="https://alpha-token-blockchain.onrender.com"
NUM_USERS=10  # Start with 10, increase to 100

echo "🧪 Load Testing ALPHA TOKEN Blockchain"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Generate wallets
echo "📝 Generating $NUM_USERS wallets..."
WALLETS=()
for i in $(seq 1 $NUM_USERS); do
  WALLET=$(curl -s $API/crypto/keygen | jq -r '.address')
  WALLETS+=($WALLET)
  echo "  ✓ Wallet $i: ${WALLET:0:10}..."
done

# Mint tokens to each wallet
echo ""
echo "💰 Minting 1000 ALPHA_TOKEN to each wallet..."
for i in "${!WALLETS[@]}"; do
  WALLET=${WALLETS[$i]}
  curl -s -X POST $API/mint \
    -H "Content-Type: application/json" \
    -d "{\"toAddress\":\"$WALLET\",\"amount\":1000,\"tokenId\":\"ALPHA_TOKEN\"}" > /dev/null
  echo "  ✓ Wallet $((i+1)): 1000 tokens minted"
done

# Create transfers between random wallets
echo ""
echo "💸 Creating $NUM_USERS transfers..."
for i in $(seq 1 $NUM_USERS); do
  FROM=${WALLETS[$RANDOM % ${#WALLETS[@]}]}
  TO=${WALLETS[$RANDOM % ${#WALLETS[@]}]}
  
  if [ "$FROM" != "$TO" ]; then
    curl -s -X POST $API/transactions \
      -H "Content-Type: application/json" \
      -d "{\"fromAddress\":\"$FROM\",\"toAddress\":\"$TO\",\"amount\":50,\"tokenId\":\"ALPHA_TOKEN\"}" > /dev/null
    echo "  ✓ Transfer $i: ${FROM:0:8}... → ${TO:0:8}..."
  fi
done

# Create blocks
echo ""
echo "⛓️ Creating blocks to confirm transactions..."
for i in $(seq 1 5); do
  MINER=${WALLETS[$RANDOM % ${#WALLETS[@]}]}
  curl -s -X POST $API/mining/mine \
    -H "Content-Type: application/json" \
    -d "{\"minerAddress\":\"$MINER\"}" > /dev/null
  echo "  ✓ Block $i created"
done

# Check blockchain stats
echo ""
echo "📊 Final Blockchain Stats:"
curl -s $API/blockchain/info | jq '{blockCount, transactionCount, tokenSupplies}'

echo ""
echo "✅ Load test complete!"
```

### Day 5: Test with 10-20 Users

1. **Run test script:**
   ```bash
   # Linux/Mac:
   chmod +x test-load.sh
   ./test-load.sh

   # Windows PowerShell:
   # Convert script to .ps1 and run
   ```

2. **Monitor Render logs:**
   - Open Render Dashboard
   - Click your service
   - Go to **Logs tab**
   - Watch for errors

3. **Check response times:**
   - Should see responses in < 500ms
   - If slow: Check Render CPU/memory usage

4. **Record results:**
   ```
   Date: April 1, 2026
   Users Tested: 10
   Wallets: ✓
   Minting: ✓ (1000 tokens each)
   Transfers: ✓ (50 tokens each)
   Blocks Created: ✓ (5 blocks)
   Avg Response Time: XXXms
   Errors: 0 ✓
   ```

### Day 6: Scale to 100 Users

1. **Update test script:** Change `NUM_USERS=100`

2. **Run full load test:**
   ```bash
   # This will take 5-10 minutes
   ./test-load.sh
   ```

3. **Monitor performance:**
   - Check Render logs for warnings
   - CPU should stay < 80%
   - Memory should stay < 400MB

4. **Test API endpoints:**
   ```bash
   # Query all 100 wallets' balances
   for wallet in $(cat wallets.txt); do
     curl https://alpha-token-blockchain.onrender.com/balance/$wallet/ALPHA_TOKEN
   done

   # Check blockchain stats
   curl https://alpha-token-blockchain.onrender.com/blockchain/info
   ```

5. **Record:** Document any issues found

### Troubleshooting Load Issues

**Slow responses (> 1 sec)?**
```bash
# Check Render logs for errors
# Look for: "Error", "timeout", "EADDRINUSE"

# If persistent: Upgrade to paid tier
# Render Dashboard → Plan → Upgrade
```

**Out of memory?**
```bash
# Reduce concurrent users
# Or upgrade plan to $7/month (1GB RAM)
```

**Data corruption?**
```bash
# Reset data in Render
# Delete service and redeploy
# Data will be fresh
```

---

# 🎉 DAY 7: Go Live!

## ⏱️ Time Required: 30 minutes

### Step 1: Final Verification (5 min)

Run final health checks:

```bash
API="https://alpha-token-blockchain.onrender.com"

# 1. Health check
curl $API/health
# Expected: {"status":"ok",...}

# 2. Blockchain status
curl $API/blockchain/info
# Expected: blockCount, transactionCount, etc.

# 3. Wallet generation
curl $API/crypto/keygen
# Expected: address, publicKey, privateKey

# 4. Full transaction flow
ADDR1=$(curl -s $API/crypto/keygen | jq -r '.address')
ADDR2=$(curl -s $API/crypto/keygen | jq -r '.address')

curl -X POST $API/mint \
  -H "Content-Type: application/json" \
  -d "{\"toAddress\":\"$ADDR1\",\"amount\":1000,\"tokenId\":\"ALPHA_TOKEN\"}"

curl -X POST $API/transactions \
  -H "Content-Type: application/json" \
  -d "{\"fromAddress\":\"$ADDR1\",\"toAddress\":\"$ADDR2\",\"amount\":250,\"tokenId\":\"ALPHA_TOKEN\"}"

curl -X POST $API/mining/mine \
  -H "Content-Type: application/json" \
  -d "{\"minerAddress\":\"$ADDR1\"}"

# Check balances
curl $API/balance/$ADDR1/ALPHA_TOKEN
# Expected: fewer tokens (after transfer)

curl $API/balance/$ADDR2/ALPHA_TOKEN
# Expected: 250 tokens received
```

✅ **All tests pass? Ready to go live!**

### Step 2: Prepare Launch Announcement (10 min)

Send this to your 100 test users:

```
═════════════════════════════════════════════════════════════════
        🎉 ALPHA TOKEN BLOCKCHAIN IS LIVE! 🎉
═════════════════════════════════════════════════════════════════

Welcome! Your blockchain is now live on the internet.

📍 API Endpoint:
   https://alpha-token-blockchain.onrender.com

🚀 Quick Start (< 2 minutes):

1. Generate a wallet:
   curl https://alpha-token-blockchain.onrender.com/crypto/keygen

   Save your address (looks like 0x...)

2. Get tokens (1000 ALPHA_TOKEN):
   curl -X POST https://alpha-token-blockchain.onrender.com/mint \
     -H "Content-Type: application/json" \
     -d '{"toAddress":"0xYOUR_ADDRESS","amount":1000,"tokenId":"ALPHA_TOKEN"}'

3. Check your balance:
   curl https://alpha-token-blockchain.onrender.com/balance/0xYOUR_ADDRESS/ALPHA_TOKEN

4. Transfer to a friend:
   curl -X POST https://alpha-token-blockchain.onrender.com/transactions \
     -H "Content-Type: application/json" \
     -d '{
       "fromAddress":"0xYOUR_ADDRESS",
       "toAddress":"0xFRIEND_ADDRESS",
       "amount":100,
       "tokenId":"ALPHA_TOKEN"
     }'

5. Confirm the transaction:
   curl -X POST https://alpha-token-blockchain.onrender.com/mining/mine \
     -H "Content-Type: application/json" \
     -d '{"minerAddress":"0xYOUR_ADDRESS"}'

📚 Full Documentation:
   [QUICKSTART.md link]

⚡ Features:
   ✓ Instant transactions (no mining delays)
   ✓ Real-time balance updates
   ✓ Unlimited wallets
   ✓ 100+ concurrent users supported

💬 Questions?
   Email: aprameyams2001@gmail.com
   API Docs: [your docs]

═════════════════════════════════════════════════════════════════
                    Let's build together! 🚀
═════════════════════════════════════════════════════════════════
```

### Step 3: Share the Link (5 min)

1. **Email announcement** to all 100 users
2. **Post on social media** (if applicable)
3. **Create a simple landing page** (optional):
   ```html
   ALPHA TOKEN Blockchain
   ======================
   API: https://alpha-token-blockchain.onrender.com
   Docs: [link to QUICKSTART.md]
   ```

### Step 4: Monitor First 24 Hours (10 min/hour)

For the first 24 hours, check:

1. **Render Dashboard:**
   - CPU usage (should stay < 50%)
   - Memory usage (should stay < 300MB)
   - Error logs (should be empty)

2. **Respond to user questions:**
   - Check email for support requests
   - Fix any critical bugs
   - Document common issues

3. **Check blockchain health:**
   ```bash
   # Every 2 hours, run:
   curl https://alpha-token-blockchain.onrender.com/blockchain/info
   
   # Verify:
   # - blockCount increasing
   # - No error messages
   # - transactionCount reasonable
   ```

### Success Criteria ✅

Your blockchain launch is successful if:

- ✅ All 100 users can access the API
- ✅ Wallet generation works
- ✅ Token minting works
- ✅ Transfers process instantly
- ✅ No errors in Render logs
- ✅ Response times < 500ms
- ✅ Zero data loss

---

# 🎯 Summary Timeline

```
┌─────────────────────────────────────────────────────────┐
│ DAY 3: Accounts & GitHub (30 min)                       │
│ - Create GitHub account                                 │
│ - Create repository                                     │
│ - Push blockchain code                                  │
├─────────────────────────────────────────────────────────┤
│ DAY 4: Deploy to Render (45 min)                        │
│ - Create Render account                                 │
│ - Configure web service                                 │
│ - Deploy blockchain                                     │
│ - Test public URL                                       │
├─────────────────────────────────────────────────────────┤
│ DAY 5-6: Load Testing (6-8 hours)                       │
│ - Day 5: Test with 10-20 users                          │
│ - Day 6: Test with 100 users                            │
│ - Monitor performance                                   │
│ - Fix any issues                                        │
├─────────────────────────────────────────────────────────┤
│ DAY 7: Go Live! (30 min)                                │
│ - Final verification                                    │
│ - Send announcement to 100 users                        │
│ - Monitor first 24 hours                                │
│ - Celebrate! 🎉                                          │
└─────────────────────────────────────────────────────────┘
```

---

# 📞 Support

**Issues?**
- Check Render logs first (99% of issues are there)
- Verify environment variables are set
- Try redeploying
- Check if port 3000 is available

**Questions?**
- Email: aprameyams2001@gmail.com
- Check QUICKSTART.md for API examples

---

**You've got this! 7-day launch incoming! 🚀**
