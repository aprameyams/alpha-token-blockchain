# Custom Token Blockchain

A complete, production-ready blockchain implementation designed specifically for hosting custom tokens. Built with TypeScript and Node.js, featuring smart contracts, P2P networking, mining, REST API, CLI, and web dashboard.

## 🚀 Features

### Core Blockchain
- **Proof of Work (PoW) Consensus**: Secure mining with difficulty adjustment
- **Token System**: Native token support with custom token creation
- **Transaction Validation**: Cryptographic validation and signature verification
- **Chain Validation**: Full blockchain integrity verification

### Smart Contracts
- **Contract Deployment**: Deploy custom contracts to the blockchain
- **Contract Execution**: Execute contract functions with sandboxed environment
- **State Management**: Persistent contract state storage
- **Token Balance Management**: Contract-level token balance tracking

### Networking
- **P2P Network**: Decentralized node communication
- **Block Synchronization**: Automatic chain sync with peers
- **Transaction Broadcasting**: Real-time transaction propagation
- **Peer Discovery**: Connect to other blockchain nodes

### API & Interfaces
- **REST API**: Complete HTTP API for blockchain interaction
- **CLI Tool**: Command-line interface for blockchain management
- **Web Dashboard**: Real-time monitoring and control interface

## 📋 System Requirements

- Node.js 16.x or higher
- npm or yarn package manager
- TypeScript 5.x

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd blockchain
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## ⚙️ Configuration

Edit `.env` file to configure:

```env
# Mining difficulty (higher = harder)
DIFFICULTY=4

# Average block time in milliseconds
BLOCK_TIME=10000

# Mining reward per block
REWARD_PER_BLOCK=100

# P2P Network settings
P2P_HOST=localhost
P2P_PORT=8000

# API Server settings
API_PORT=3000

# Dashboard settings
DASHBOARD_PORT=8080
```

## 🚀 Usage

### Start Blockchain Node

```bash
npm run node
```

This will start:
- REST API on port 3000
- P2P network on port 8000

### Web Dashboard

```bash
npm run dashboard
```

Open http://localhost:8080 in your browser to access the web dashboard.

### CLI Commands

```bash
# Get blockchain information
npm run blockchain -- info

# Display blockchain
npm run blockchain -- chain --limit 10

# Get address balance
npm run blockchain -- balance 0x1234... NATIVE_TOKEN

# Create a transaction
npm run blockchain -- tx 0xfrom 0xto 100 NATIVE_TOKEN

# Mine pending transactions
npm run blockchain -- mine 0xminer

# Mint tokens
npm run blockchain -- mint 0xaddress 1000 TOKEN_ID

# Burn tokens
npm run blockchain -- burn 0xaddress 100 TOKEN_ID

# Generate keypair
npm run blockchain -- keygen

# Sign a message
npm run blockchain -- sign "message" "private_key"

# Verify a signature
npm run blockchain -- verify "message" "signature" "public_key"

# Deploy smart contract
npm run blockchain -- deploy 0xcreator

# Reset blockchain
npm run blockchain -- reset
```

## 📡 REST API Endpoints

### Blockchain Information
- `GET /health` - Server health check
- `GET /blockchain/info` - Blockchain statistics
- `GET /blockchain/chain` - Get entire blockchain
- `GET /blockchain/block/:height` - Get block by height
- `GET /blockchain/block-hash/:hash` - Get block by hash

### Transactions
- `GET /transactions/pending` - Get pending transactions
- `POST /transactions` - Create new transaction
- `POST /mint` - Mint tokens (admin)
- `POST /burn` - Burn tokens

### Balances
- `GET /balance/:address` - Get all balances
- `GET /balance/:address/:tokenId` - Get specific token balance

### Cryptography
- `GET /crypto/keypair` - Generate new keypair
- `POST /crypto/sign` - Sign a message
- `POST /crypto/verify` - Verify a signature

### Smart Contracts
- `POST /contracts/deploy` - Deploy contract
- `GET /contracts/:address` - Get contract
- `POST /contracts/:address/call` - Call contract function

### Network
- `GET /network/info` - Network statistics
- `GET /network/node` - Node information
- `POST /network/peers` - Connect to peer
- `GET /network/peers` - Get connected peers

## 📝 Example: Create and Transfer Tokens

### 1. Generate Keypairs
```bash
npm run blockchain -- keygen
# Save the generated address and private key
```

### 2. Mint Tokens
```bash
npm run blockchain -- mint 0xonlyouraddress 1000 MY_TOKEN
```

### 3. Create Transaction
```bash
npm run blockchain -- tx 0xyouraddress 0xrecipient 100 MY_TOKEN
```

### 4. Mine Block
```bash
npm run blockchain -- mine 0xmineraddress
```

### 5. Check Balance
```bash
npm run blockchain -- balance 0xrecipient MY_TOKEN
```

## 🤝 P2P Networking

### Connect Nodes

**Node 1** (Primary):
```bash
npm run node
# Listen on port 8000
```

**Node 2** (Secondary):
```bash
P2P_PORT=8001 npm run node
```

Via REST API:
```bash
curl -X POST http://localhost:3000/network/peers \
  -H "Content-Type: application/json" \
  -d '{
    "peerId": "node2-id",
    "host": "localhost",
    "port": 8001
  }'
```

## 🧠 Smart Contracts

### Deploy a Token Contract

```javascript
const tokenContract = `{
  initialize(owner) {
    this.state.owner = owner;
    this.state.totalSupply = 0;
    this.state.balances = {};
    return { success: true };
  },
  
  mint(amount) {
    if (context.sender !== this.state.owner) {
      throw new Error('Only owner can mint');
    }
    this.state.totalSupply += amount;
    this.state.balances[context.sender] = (this.state.balances[context.sender] || 0) + amount;
    return { success: true, totalSupply: this.state.totalSupply };
  },
  
  transfer(to, amount) {
    const from = context.sender;
    const fromBalance = this.state.balances[from] || 0;
    if (fromBalance < amount) {
      throw new Error('Insufficient balance');
    }
    this.state.balances[from] -= amount;
    this.state.balances[to] = (this.state.balances[to] || 0) + amount;
    return { success: true, to, amount };
  },
  
  balanceOf(account) {
    return this.state.balances[account] || 0;
  }
}`;

// Deploy via REST API
curl -X POST http://localhost:3000/contracts/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "creator": "0xcontractCreator",
    "code": "'"$tokenContract"'"
  }'
```

### Call Contract Function

```bash
curl -X POST http://localhost:3000/contracts/0xcontractaddress/call \
  -H "Content-Type: application/json" \
  -d '{
    "functionName": "transfer",
    "args": ["0xrecipient", 100],
    "sender": "0xcaller"
  }'
```

## 🏗️ Project Structure

```
blockchain/
├── src/
│   ├── core/                 # Core blockchain logic
│   │   ├── blockchain.ts     # Main blockchain implementation
│   │   ├── crypto.ts         # Cryptographic utilities
│   │   ├── smartContract.ts  # Smart contract VM
│   │   └── types.ts          # TypeScript interfaces
│   ├── network/              # P2P networking
│   │   └── p2p.ts            # P2P node implementation
│   ├── api/                  # REST API
│   │   └── server.ts         # Express API server
│   ├── cli/                  # Command-line interface
│   │   ├── blockchain.ts     # CLI entry point
│   │   └── blockchainCLI.ts  # CLI commands
│   ├── node/                 # Node runner
│   │   └── node.ts           # Main node class
│   ├── dashboard/            # Web dashboard
│   │   └── server.ts         # Dashboard server
│   ├── public/               # Static files
│   │   └── index.html        # Dashboard UI
│   └── index.ts              # Application entry point
├── dist/                     # Compiled JavaScript
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── .env                      # Configuration
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

## 📊 Blockchain Data Structures

### Block
```typescript
interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  miner: string;
  difficulty: number;
}
```

### Transaction
```typescript
interface Transaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenId: string;
  timestamp: number;
  signature?: string;
  data?: any;
}
```

### Smart Contract
```typescript
interface SmartContract {
  id: string;
  address: string;
  creator: string;
  code: string;
  state: any;
  balance: { [tokenId: string]: number };
  createdAt: number;
  deploymentBlockHeight: number;
}
```

## 🔐 Security Features

- **Cryptographic Hashing**: SHA-256 for block hashing
- **Digital Signatures**: ECDSA (secp256k1) for transaction signing
- **Proof of Work**: Difficulty-based consensus mechanism
- **Chain Validation**: Full blockchain integrity verification
- **Signature Verification**: Cryptographic transaction validation

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📈 Performance

- **Block Time**: ~10 seconds (configurable)
- **Transaction Throughput**: ~100 transactions per block
- **Mining Speed**: Depends on difficulty setting
- **Network Latency**: Peer-dependent

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change ports in .env
API_PORT=3001
P2P_PORT=8001
DASHBOARD_PORT=8081
```

### Mining Too Slow
```bash
# Reduce difficulty in .env
DIFFICULTY=2
```

### Connection Issues
```bash
# Check P2P network configuration
npm run blockchain -- info
```

## 📚 Further Reading

- [Blockchain Basics](https://en.wikipedia.org/wiki/Blockchain)
- [Proof of Work](https://en.wikipedia.org/wiki/Proof_of_work)
- [Smart Contracts](https://en.wikipedia.org/wiki/Smart_contract)
- [Cryptography](https://en.wikipedia.org/wiki/Cryptography)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This is an educational blockchain implementation designed for learning purposes. For production use, additional security audits and optimizations are recommended.

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using TypeScript and Node.js
