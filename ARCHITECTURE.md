# Architecture Guide

## System Overview

This blockchain is a complete, modular system designed for hosting custom tokens and smart contracts. The architecture follows these core principles:

- **Modularity**: Each component is independent and replaceable
- **Scalability**: Designed to handle multiple nodes and transactions
- **Security**: Cryptographic security at every layer
- **Transparency**: All code is open and auditable

## Component Architecture

### 1. Core Blockchain Engine (`src/core/`)

#### Blockchain (`blockchain.ts`)
The heart of the system managing:
- **Chain Management**: Maintains the immutable ledger
- **Transaction Pool**: Manages pending transactions
- **Block Mining**: Implements Proof of Work consensus
- **Token State**: Tracks token balances
- **Difficulty Adjustment**: Adapts mining difficulty dynamically

**Key Methods:**
```typescript
minePendingTransactions(minerAddress)  // Mine a new block
addTransaction(tx)                     // Add to pending pool
getBalance(address, tokenId)           // Query token balance
validateBlock(block)                   // Verify block integrity
```

#### Cryptography (`crypto.ts`)
Provides cryptographic primitives:
- **SHA-256 Hashing**: For block and transaction hashing
- **ECDSA (secp256k1)**: For digital signatures
- **Key Pair Generation**: Creates public/private key pairs
- **Proof of Work**: Implements difficulty-based mining

**Security Features:**
- 256-bit hashing
- Elliptic Curve cryptography
- Configurable difficulty levels

#### Smart Contracts (`smartContract.ts`)
Allows programmable transactions:
- **Contract Deployment**: Upload contract code
- **Function Execution**: Call contract methods
- **State Management**: Persistent contract state
- **Sandboxed Execution**: Isolated contract environment

**Supported Operations:**
- Token creation and transfer
- Multi-signature contracts
- Complex business logic

#### Type Definitions (`types.ts`)
Core data structures:
```typescript
Block          // { index, timestamp, transactions, hash, nonce, ... }
Transaction    // { id, from, to, amount, tokenId, signature, ... }
SmartContract  // { id, address, creator, code, state, balance, ... }
TokenState     // { [address]: { [tokenId]: balance } }
```

### 2. Networking Layer (`src/network/`)

#### P2P Node (`p2p.ts`)
Decentralized node communication:
- **Peer Management**: Connect and disconnect from peers
- **Message Broadcasting**: Propagate blocks and transactions
- **Chain Synchronization**: Sync blockchain state with peers
- **Event System**: Emit events for external listeners

**Network Protocol:**
- Block propagation
- Transaction broadcasting
- Chain synchronization requests
- Peer discovery

**Message Types:**
```
BLOCK              - New block propagation
TRANSACTION        - New transaction broadcast
CHAIN_REQUEST      - Request blockchain blocks
CHAIN_RESPONSE     - Send blockchain blocks
PEER_INFO          - Node information
```

### 3. API Layer (`src/api/`)

#### REST Server (`server.ts`)
HTTP interface for blockchain interaction:
- **Blockchain Endpoints**: Query chain state
- **Transaction Endpoints**: Submit and track transactions
- **Balance Endpoints**: Check token balances
- **Contract Endpoints**: Deploy and call contracts
- **Network Endpoints**: Manage peer connections

**Key Routes:**
```
GET    /health
GET    /blockchain/info
GET    /blockchain/chain
POST   /transactions
GET    /balance/:address/:tokenId
POST   /contracts/deploy
POST   /contracts/:address/call
```

### 4. CLI Interface (`src/cli/`)

#### Command-Line Tool (`blockchainCLI.ts`)
User-friendly command-line interface:
- **Blockchain Management**: Mine, validate, reset
- **Token Operations**: Mint, burn, transfer
- **Key Management**: Generate keypairs, sign messages
- **Contract Deployment**: Deploy and manage contracts

**Available Commands:**
```bash
info              # Blockchain information
chain             # Display blocks
balance           # Check balances
tx                # Create transaction
mine              # Mine block
mint              # Mint tokens
burn              # Burn tokens
keygen            # Generate keypair
sign              # Sign message
verify            # Verify signature
deploy            # Deploy contract
reset             # Reset blockchain
```

### 5. Node Runner (`src/node/`)

#### Main Node (`node.ts`)
Orchestrates all components:
- **Initialization**: Set up blockchain, P2P, API
- **Event Handling**: Connect component events
- **Configuration**: Load environment settings
- **Runtime Management**: Start and manage services

### 6. Dashboard (`src/dashboard/`)

#### Web Interface
Modern real-time monitoring:
- **Live Statistics**: Chain height, transaction count, difficulty
- **Block Explorer**: View recent blocks and transactions
- **Token Management**: Mint and transfer tokens
- **Key Generation**: Create wallets
- **Network Monitoring**: View peer connections

## Data Flow

### Mining Flow
```
1. User submits transactions via API/CLI
2. Transactions added to memory pool
3. User initiates mining via API/CLI
4. Blockchain selects transactions from pool
5. Proof of Work computation begins
6. Valid block found and added to chain
7. Block broadcast to all peers
8. State updated with new balances
9. Difficulty adjusted
```

### Transaction Flow
```
1. User creates transaction (sign if needed)
2. Transaction submitted via API/REST
3. Blockchain validates transaction
4. Transaction added to pending pool
5. Transaction broadcast to network
6. Peers receive and validate transaction
7. Peers add to their memory pools
8. Miners include in next block
9. Block confirmation updates state
```

### Consensus Flow
```
1. Each miner independently works on next block
2. First to solve PoW broadcasts block
3. Other nodes validate block
4. Block added if valid
5. Chain becomes consistent across network
6. Difficulty adjusted based on block time
```

## Security Model

### Cryptographic Security
- **Block Integrity**: Each block contains hash of previous block
- **Transaction Signing**: Transactions can be signed with ECDSA
- **Chain Immutability**: Changing past blocks requires recalculating all subsequent PoW
- **Address Derivation**: Addresses derived from public keys using SHA-256

### Consensus Security
- **Proof of Work**: Attacker must control 51% of mining power
- **Difficulty Adjustment**: Maintains stable block time
- **Chain Validation**: Full blockchain validation on sync

### Application Security
- **Input Validation**: All inputs validated before processing
- **Contract Sandboxing**: Contracts run in isolated environment
- **Rate Limiting**: (Can be added to API layer)
- **CORS**: Cross-origin requests handled safely

## Scalability Considerations

### Current Limitations
- Single-node blockchain in memory
- No database persistence (can be added)
- No transaction sharding
- Sequential block production

### Future Improvements
- Database backend (LevelDB, RocksDB)
- Transaction mempool optimization
- Sharding for horizontal scaling
- Delegated Proof of Stake
- Light client support
- Cross-chain bridges

## Configuration

### Environment Variables
```env
DIFFICULTY=4              # Mining difficulty (1-10 recommended)
BLOCK_TIME=10000         # Target block time in ms
REWARD_PER_BLOCK=100     # Mining reward amount
DIFFICULTY_INTERVAL=10   # Blocks between difficulty adjustment

P2P_HOST=localhost       # P2P server host
P2P_PORT=8000           # P2P server port

API_PORT=3000           # REST API port
DASHBOARD_PORT=8080     # Web dashboard port
```

## Performance Metrics

### Benchmarks
- **Block Time**: ~10 seconds (with DIFFICULTY=4)
- **Transaction Throughput**: ~100 tx/block × 6 blocks/min = 600 tx/min
- **Network Speed**: Peer-dependent
- **Memory Usage**: ~100MB for 1000 blocks

### Optimization Tips
- Reduce `DIFFICULTY` for faster mining
- Increase `BLOCK_TIME` for more transactions per block
- Add database backend for proven chain storage
- Implement transaction batching

## Extension Points

### Custom Mining Algorithm
Replace PoW with PoS, DPoS, or other consensus:
```typescript
// In Blockchain.minePendingTransactions()
// Replace Crypto.findPoW() with custom algorithm
```

### Additional Token Operations
Add burning, staking, or other token mechanics:
```typescript
// In Blockchain class
transferWithFee(from, to, amount, fee)
stakingReward(staker, amount)
```

### Database Persistence
Add LevelDB or other persistence:
```typescript
// In Blockchain class
saveBlockToDB(block)
loadBlockFromDB(hash)
```

### Advanced Networking
Implement full P2P protocol:
- Transaction pool synchronization
- Block header validation
- SPV (Simplified Payment Verification)
- Peer reputation system

## Testing Strategy

### Unit Tests
- Crypto functions
- Block validation
- Transaction validation
- Token state management

### Integration Tests
- Mining flow
- Network synchronization
- Contract execution
- API endpoints

### Load Tests
- Many transactions
- Many peers
- Large blocks
- Chain with thousands of blocks

---

For more details, see [README.md](README.md)
