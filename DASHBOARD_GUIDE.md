# 🖥️ Web Dashboard - Real-Time Blockchain Monitoring

## Access Your Dashboard

### Step 1: Start Both Servers

Open **TWO terminals** in your blockchain directory:

**Terminal 1 - API Server:**
```bash
cd c:\Users\ad\Downloads\blockchain
npm run node
```
✅ Shows: `API Server listening on http://localhost:3000`

**Terminal 2 - Dashboard Server:**
```bash
cd c:\Users\ad\Downloads\blockchain
npm run dashboard
```
✅ Shows: `Dashboard server listening on http://localhost:8080`

### Step 2: Open Dashboard in Browser

Go to: **http://localhost:8080**

You should see the ALPHA TOKEN Dashboard with real-time updates!

---

## 📊 Dashboard Features

### 🔹 Top Section - Live Stats

```
Blockchain Status
├── Chain Height: X
├── Pending Transactions: Y
├── Difficulty: 1
└── Valid: ✓
```

Updates in **real-time** as you:
- Create transactions
- Mine blocks
- Add tokens

### 🔹 Generate Keypair (Easy Wallet Creation)

1. Click **"Generate Keypair"** button
2. You get:
   - Address (0x...)
   - Public Key
   - Private Key
3. Copy and save for later use

### 🔹 Mint Tokens Section

```
Mint Tokens
├── To Address: [input field]
├── Amount: [input field]
├── Token ID: [input field - default: ALPHA_TOKEN]
└── [Mint Button]
```

**Example:**
1. Paste your address
2. Enter amount: `1000`
3. Click "Mint"
4. ✅ 1000 ALPHA_TOKEN added instantly!

### 🔹 Create Transaction

```
Create Transaction
├── From Address: [input]
├── To Address: [input]
├── Amount: [input]
├── Token ID: [input - ALPHA_TOKEN]
└── [Send Button]
```

**Example:**
1. Paste sender's address
2. Paste recipient's address
3. Enter amount: `250`
4. Click "Send"
5. ✅ Transaction created (pending)

### 🔹 Check Balance

```
Check Balance
├── Address: [input field]
├── Token ID: [input - ALPHA_TOKEN]
└── [Check Button]
```

Shows: `Balance: XXX ALPHA_TOKEN`

### 🔹 Real-Time Block Explorer

Shows:
- Latest blocks
- Transaction count per block
- Block hash
- Miner address
- Timestamp

**Updates automatically** every 2 seconds!

### 🔹 Mine Block Button

Click **"Mine Block"** to:
1. Confirm all pending transactions
2. Create new block
3. Update chain height
4. Show in explorer

---

## 🎬 Full Workflow Example

**Demo: Complete token transaction via dashboard**

### Step 1: Generate Two Wallets

Terminal 1: Start API
```bash
npm run node
```

Terminal 2: Start Dashboard
```bash
npm run dashboard
```

Dashboard: Click **"Generate Keypair"** (twice)
```
Wallet 1: 0x.... (copy this)
Wallet 2: 0x.... (copy this)
```

### Step 2: Mint Tokens to Wallet 1

Dashboard → Mint Tokens section:
```
To Address: 0x[Wallet 1]
Amount: 1000
Token ID: ALPHA_TOKEN
Click: Mint Button
```

✅ You'll see toast: "Tokens minted successfully!"

### Step 3: Check Balance

Dashboard → Check Balance section:
```
Address: 0x[Wallet 1]
Token ID: ALPHA_TOKEN
Click: Check Button
```

Result: `Balance: 1000 ALPHA_TOKEN`

### Step 4: Transfer Tokens

Dashboard → Create Transaction section:
```
From Address: 0x[Wallet 1]
To Address: 0x[Wallet 2]
Amount: 250
Token ID: ALPHA_TOKEN
Click: Send Button
```

✅ Toast: "Transaction created!"

### Step 5: Check Pending Transactions

Dashboard shows: `Pending Transactions: 1`

### Step 6: Mine Block to Confirm

Dashboard → Click **"Mine Block"** button

✅ Toast: "Block created!"

### Step 7: Verify Final Balances

Check Balance → Wallet 1:
```
Balance: 750 (1000 - 250 sent)
```

Check Balance → Wallet 2:
```
Balance: 250 (received)
```

### Step 8: View Block Explorer

Scroll down to see:
- **Block #1** with transaction(s)
- Hash: `b2d1869618d7e571...`
- Miner: your address
- Transactions: 1

---

## 🎨 Dashboard UI Elements

### Color Scheme
- ✅ Green: Success states
- ⏳ Blue: Loading states
- ❌ Red: Errors
- 🟡 Yellow: Warnings

### Interactive Elements

**Input Fields:**
- Address input (paste your 0x address)
- Amount input (numbers only)
- Token ID input (defaults to ALPHA_TOKEN)

**Buttons:**
- Generate Keypair (blue)
- Mint (green)
- Send Transaction (green)
- Check Balance (blue)
- Mine Block (green)

**Display Areas:**
- Live stats (top)
- Recent blocks (bottom)
- Transaction pool (middle)

---

## 🔄 Real-Time Updates

Dashboard auto-refreshes every **2 seconds**:

- ✅ Chain height updates
- ✅ Pending transactions count
- ✅ Block explorer refreshes
- ✅ Balance changes reflect
- ✅ New blocks appear instantly

### Manual Refresh

Press `F5` or `Ctrl+R` to force refresh.

---

## 📱 Mobile Access (Local Network)

View dashboard from phone/tablet:

1. **Find your computer's IP:**
   ```bash
   # Windows:
   ipconfig | findstr IPv4
   
   # Result: 192.168.1.X (something like this)
   ```

2. **On your phone/tablet:**
   ```
   http://192.168.1.X:8080
   ```

3. ✅ Dashboard accessible from any device!

---

## ⚙️ Customization

### Change Dashboard Port

Edit `.env`:
```env
DASHBOARD_PORT=8081
```

Restart dashboard:
```bash
npm run dashboard
```

Access at: `http://localhost:8081`

### Change Theme (Optional - Future)

Coming in Phase 2:
- Dark mode
- Custom colors
- Custom token name display

---

## 🐛 Troubleshooting

### Dashboard Won't Start

```bash
# Error: Port 8080 already in use?

# Solution 1: Use different port
DASHBOARD_PORT=8081 npm run dashboard

# Solution 2: Kill existing process
Get-Process -Name node | Stop-Process -Force
npm run dashboard
```

### Updates Not Real-Time

```bash
# Solution: Refresh page
Press F5

# Or: Hard refresh
Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Buttons Not Responding

```bash
# Solution: Check API server is running
Terminal 1: npm run node
# Should show: API Server listening on http://localhost:3000

# If not: Restart it
npm run node
```

### Data Lost After Refresh

```bash
# This shouldn't happen - data is persisted
# Check ./data/ folder exists:
ls -la ./data/

# Files should exist:
# - blocks.json
# - transactions.json
# - balances.json

# If missing: Data was lost (recreate wallets)
```

---

## 📊 Dashboard vs API

| Feature | Dashboard | API |
|---------|-----------|-----|
| **Ease of Use** | ⭐⭐⭐⭐⭐ (visual) | ⭐⭐ (curl commands) |
| **Real-Time** | ✅ Auto-refresh | ❌ Manual requests |
| **Suitable for** | Testing, demos | Integration, scripts |
| **Best for** | 1 wallet operations | 100+ wallet automation |

**Pro tip:** Use dashboard for testing, use API for production/automation!

---

## 🎯 Next Steps

1. **Open dashboard:** http://localhost:8080
2. **Generate a wallet** (click button)
3. **Mint 1000 tokens** to your address
4. **Create a transaction** to another wallet
5. **Mine a block** to confirm
6. **View block explorer** to see results

---

## 📹 Demo Video Script (For Users)

```
"Welcome to ALPHA TOKEN Dashboard!

Step 1: Generate two wallets using the Keypair button
Step 2: Mint 1000 tokens to the first wallet
Step 3: Create a transaction sending 250 tokens to the second wallet
Step 4: Click Mine Block to confirm
Step 5: Check final balances - first wallet has 750, second has 250
Step 6: View the block explorer at the bottom showing all transactions

The blockchain is instant, decentralized, and ready to scale!"
```

---

**Dashboard is live! 🎉 Start experimenting!**
