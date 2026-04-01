# Code Examples

This file contains practical code examples for common blockchain operations.

## Table of Contents

1. [Node.js Integration](#nodejs-integration)
2. [Creating Transactions](#creating-transactions)
3. [Smart Contracts](#smart-contracts)
4. [P2P Networking](#p2p-networking)
5. [API Integration](#api-integration)
6. [Advanced Usage](#advanced-usage)

## Node.js Integration

### Initialize Blockchain Programmatically

```typescript
import { Blockchain } from './core/blockchain';
import { P2PNode } from './network/p2p';
import { SmartContractVM } from './core/smartContract';
import { APIServer } from './api/server';

// Create blockchain instance
const blockchain = new Blockchain({
  difficulty: 3,
  blockTime: 5000,
  rewardPerBlock: 50,
});

// Create P2P node
const p2pNode = new P2PNode(blockchain, 'localhost', 8000);

// Create contract VM
const contractVM = new SmartContractVM();

// Create API server
const apiServer = new APIServer(blockchain, p2pNode, contractVM, 3000);

// Start server
apiServer.start();

// Listen to events
blockchain.on('blockMined', (block) => {
  console.log(`Block ${block.index} mined!`);
});

blockchain.on('transactionAdded', (tx) => {
  console.log(`Transaction ${tx.id} added to pool`);
});
```

## Creating Transactions

### Manual Transaction Creation

```typescript
import { Crypto } from './core/crypto';
import { Transaction } from './core/types';

// Generate keypair
const keyPair = Crypto.generateKeyPair();
const senderAddress = Crypto.publicKeyToAddress(keyPair.publicKey);

// Create transaction
const tx: Transaction = {
  id: Crypto.randomId(),
  fromAddress: senderAddress,
  toAddress: 'recipient_address_here',
  amount: 100,
  tokenId: 'MY_TOKEN',
  timestamp: Date.now(),
};

// Sign transaction
const message = `${tx.fromAddress}${tx.toAddress}${tx.amount}${tx.tokenId}${tx.timestamp}`;
tx.signature = Crypto.sign(message, keyPair.privateKey);

// Add to blockchain
blockchain.addTransaction(tx);
```

### Via REST API

```javascript
// Create transaction
const response = await fetch('http://localhost:3000/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromAddress: 'sender_address',
    toAddress: 'recipient_address',
    amount: 100,
    tokenId: 'MY_TOKEN',
  }),
});

const result = await response.json();
console.log('Transaction created:', result.transaction.id);
```

## Smart Contracts

### Deploy Token Contract

```typescript
// Define contract code
const tokenContractCode = `
{
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
    this.state.balances[context.sender] = 
      (this.state.balances[context.sender] || 0) + amount;
    return { success: true, totalSupply: this.state.totalSupply };
  },

  transfer(to, amount) {
    const from = context.sender;
    const balance = this.state.balances[from] || 0;
    
    if (balance < amount) {
      throw new Error('Insufficient balance');
    }
    
    this.state.balances[from] -= amount;
    this.state.balances[to] = (this.state.balances[to] || 0) + amount;
    
    return { success: true, to, amount };
  },

  balanceOf(account) {
    return this.state.balances[account] || 0;
  }
}
`;

// Deploy contract
const contract = contractVM.deployContract('creator_address', tokenContractCode);
console.log('Contract deployed at:', contract.address);
```

### Call Contract Function

```typescript
// Call mint function
const result = contractVM.callContractFunction(
  contract.address,
  'mint',
  [1000], // args: amount
  'creator_address'
);
console.log(result); // { success: true, totalSupply: 1000 }

// Call transfer function
const transferResult = contractVM.callContractFunction(
  contract.address,
  'transfer',
  ['recipient_address', 100], // args: to, amount
  'creator_address'
);
console.log(transferResult); // { success: true, to: '...', amount: 100 }

// Call balanceOf function
const balance = contractVM.callContractFunction(
  contract.address,
  'balanceOf',
  ['creator_address'], // args: account
  'creator_address'
);
console.log(balance); // 900 (1000 - 100 transferred)
```

### Deploy Multi-Signature Wallet

```typescript
const multiSigCode = SmartContractVM.getMultiSigContractTemplate();

const contract = contractVM.deployContract(
  'wallet_creator',
  multiSigCode,
  {
    signers: ['signer1', 'signer2', 'signer3'],
    requiredSignatures: 2,
  }
);

// Submit transaction
contractVM.callContractFunction(
  contract.address,
  'submitTransaction',
  ['recipient', 100],
  'signer1'
);

// Approve transaction
contractVM.callContractFunction(
  contract.address,
  'approveTransaction',
  ['txId'],
  'signer2'
);
```

## P2P Networking

### Connect Multiple Nodes

```typescript
// Node 1
const blockchain1 = new Blockchain();
const p2pNode1 = new P2PNode(blockchain1, 'localhost', 8000);

// Node 2
const blockchain2 = new Blockchain();
const p2pNode2 = new P2PNode(blockchain2, 'localhost', 8001);

// Connect nodes
p2pNode1.connectToPeer(p2pNode2.getNodeId(), 'localhost', 8001);

// Listen for block received
p2pNode2.on('blockReceived', (block) => {
  console.log('Received block:', block.index);
});

// Broadcast block from node1
blockchain1.on('blockMined', (block) => {
  p2pNode1.broadcastBlock(block);
});
```

### Handle Network Messages

```typescript
// Listen for peer connection
p2pNode.on('peerConnected', (peer) => {
  console.log(`Connected to peer: ${peer.id}`);
});

// Listen for peer disconnection
p2pNode.on('peerDisconnected', (peerId) => {
  console.log(`Disconnected from peer: ${peerId}`);
});

// Listen for messages sent
p2pNode.on('messageSent', (event) => {
  console.log(`Message sent to ${event.peer}`);
});

// Get network stats
const stats = p2pNode.getNetworkStats();
console.log(`Connected to ${stats.connectedPeerCount} peers`);
```

## API Integration

### Fetch Blockchain State

```javascript
// Get blockchain info
const info = await fetch('http://localhost:3000/blockchain/info')
  .then(r => r.json());
console.log(`Chain height: ${info.stats.height}`);
console.log(`Pending transactions: ${info.stats.pendingTransactions}`);

// Get specific block
const block = await fetch('http://localhost:3000/blockchain/block/0')
  .then(r => r.json());
console.log(`Genesis block hash: ${block.hash}`);

// Get pending transactions
const pending = await fetch('http://localhost:3000/transactions/pending')
  .then(r => r.json());
console.log(`${pending.length} transactions waiting to be mined`);
```

### Manage Tokens

```javascript
// Mint tokens
await fetch('http://localhost:3000/mint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    toAddress: '0x1234...',
    tokenId: 'MY_TOKEN',
    amount: 1000,
  }),
});

// Get balance
const balances = await fetch('http://localhost:3000/balance/0x1234...')
  .then(r => r.json());
console.log(balances.balances); // { MY_TOKEN: 1000 }

// Get specific token balance
const balance = await fetch('http://localhost:3000/balance/0x1234.../MY_TOKEN')
  .then(r => r.json());
console.log(balance.balance); // 1000

// Burn tokens
await fetch('http://localhost:3000/burn', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromAddress: '0x1234...',
    tokenId: 'MY_TOKEN',
    amount: 100,
  }),
});
```

### Cryptographic Operations

```javascript
// Generate keypair
const keyPair = await fetch('http://localhost:3000/crypto/keypair')
  .then(r => r.json());
console.log('Address:', keyPair.address);
console.log('Public Key:', keyPair.publicKey);
console.log('Private Key:', keyPair.privateKey);

// Sign message
const signed = await fetch('http://localhost:3000/crypto/sign', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello blockchain!',
    privateKey: keyPair.privateKey,
  }),
}).then(r => r.json());
console.log('Signature:', signed.signature);

// Verify signature
const verified = await fetch('http://localhost:3000/crypto/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello blockchain!',
    signature: signed.signature,
    publicKey: keyPair.publicKey,
  }),
}).then(r => r.json());
console.log('Valid:', verified.isValid); // true
```

## Advanced Usage

### Mining Auto-Loop

```typescript
import { Blockchain } from './core/blockchain';

async function autoMine(blockchain: Blockchain, minerAddress: string) {
  while (true) {
    try {
      const pending = blockchain.getPendingTransactions();
      if (pending.length > 0) {
        console.log(`Mining block with ${pending.length} transactions...`);
        const block = blockchain.minePendingTransactions(minerAddress);
        console.log(`Block ${block.index} mined! Hash: ${block.hash}`);
      }
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Mining error:', error);
    }
  }
}

// Start auto mining
autoMine(blockchain, 'miner_address');
```

### Chain Validation & Repair

```typescript
// Validate entire chain
function validateChain(blockchain: Blockchain) {
  if (blockchain.isValid()) {
    console.log('✓ Blockchain is valid');
  } else {
    console.log('✗ Blockchain is invalid!');
    // Implement recovery logic
  }
}

// Get chain statistics
const stats = blockchain.getStats();
console.log(`Chain height: ${stats.height}`);
console.log(`Total transactions: ${stats.totalTransactions}`);
console.log(`Pending transactions: ${stats.pendingTransactions}`);
console.log(`Current difficulty: ${stats.difficulty}`);
console.log(`Total addresses: ${stats.totalAddresses}`);
```

### Event-Driven Architecture

```typescript
// Block events
blockchain.on('blockCreated', (block) => {
  console.log(`Block event: ${block.index} created`);
  // Update UI, persist to database, etc.
});

blockchain.on('blockMined', (block) => {
  console.log(`Block event: ${block.index} mined`);
  // Notify connected clients
});

// Transaction events
blockchain.on('transactionAdded', (tx) => {
  console.log(`Transaction event: ${tx.id} added`);
  // Update transaction pool in UI
});

// Token events
blockchain.on('tokensMinted', ({ toAddress, tokenId, amount }) => {
  console.log(`Token event: ${amount} ${tokenId} minted to ${toAddress}`);
});

blockchain.on('tokensBurned', ({ fromAddress, tokenId, amount }) => {
  console.log(`Token event: ${amount} ${tokenId} burned from ${fromAddress}`);
});

// Difficulty events
blockchain.on('difficultyAdjusted', (difficulty) => {
  console.log(`Difficulty adjusted to ${difficulty}`);
});
```

### Batch Operations

```typescript
// Create multiple transactions at once
function createBatchTransactions(
  blockchain: Blockchain,
  fromAddress: string,
  recipients: Array<{ address: string; amount: number; tokenId: string }>
) {
  const txIds = [];
  
  for (const recipient of recipients) {
    const tx = {
      id: Crypto.randomId(),
      fromAddress,
      toAddress: recipient.address,
      amount: recipient.amount,
      tokenId: recipient.tokenId,
      timestamp: Date.now(),
    };
    
    if (blockchain.addTransaction(tx)) {
      txIds.push(tx.id);
    }
  }
  
  return txIds;
}

// Usage
const recipients = [
  { address: '0xaddr1', amount: 100, tokenId: 'TOKEN1' },
  { address: '0xaddr2', amount: 200, tokenId: 'TOKEN1' },
  { address: '0xaddr3', amount: 150, tokenId: 'TOKEN2' },
];

const txIds = createBatchTransactions(blockchain, 'sender', recipients);
```

---

For more documentation, see [README.md](README.md) and [ARCHITECTURE.md](ARCHITECTURE.md).
