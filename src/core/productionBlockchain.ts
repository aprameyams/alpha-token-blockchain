import { EventEmitter } from 'events';
import { Block, Transaction, ChainConfig, TokenState } from './types';
import { Crypto } from './crypto';
import { BlockchainDatabase } from './database';

/**
 * Simplified Production Blockchain with Instant Consensus
 * No mining required - transactions confirm immediately
 */
export class ProductionBlockchain extends EventEmitter {
  private tokenState: TokenState = {};
  private pendingTransactions: Transaction[] = [];
  private db: BlockchainDatabase;

  constructor(dbPath: string = 'blockchain.db') {
    super();
    this.db = new BlockchainDatabase(dbPath);
    this.initializeFromDatabase();
  }

  /**
   * Initialize from persisted database
   */
  private initializeFromDatabase(): void {
    const blocks = this.db.getAllBlocks();
    if (blocks.length === 0) {
      this.createGenesisBlock();
    } else {
      // Rebuild token state from blockchain
      for (const block of blocks) {
        this.updateTokenState(block);
      }
    }
  }

  /**
   * Create genesis block
   */
  private createGenesisBlock(): void {
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: '0',
      hash: '',
      nonce: 0,
      miner: 'GENESIS',
      difficulty: 1,
    };

    genesisBlock.hash = Crypto.hash(genesisBlock);
    this.db.saveBlock(genesisBlock);
    this.emit('blockCreated', genesisBlock);
  }

  /**
   * Get the latest block
   */
  getLatestBlock(): Block {
    const latest = this.db.getLatestBlock();
    if (!latest) {
      return this.db.getBlockByIndex(0)!;
    }
    return latest;
  }

  /**
   * Get the entire chain
   */
  getChain(): Block[] {
    return this.db.getAllBlocks();
  }

  /**
   * Get block by height
   */
  getBlockByHeight(height: number): Block | null {
    return this.db.getBlockByIndex(height);
  }

  /**
   * Get block by hash
   */
  getBlockByHash(hash: string): Block | null {
    return this.db.getBlockByHash(hash);
  }

  /**
   * Get all pending transactions
   */
  getPendingTransactions(): Transaction[] {
    return [...this.pendingTransactions];
  }

  /**
   * Add a transaction to pending pool
   */
  addTransaction(transaction: Transaction): boolean {
    if (!this.validateTransaction(transaction)) {
      return false;
    }

    this.pendingTransactions.push(transaction);
    this.db.saveTransaction(transaction);
    this.emit('transactionAdded', transaction);
    return true;
  }

  /**
   * Validate a transaction
   */
  validateTransaction(tx: Transaction): boolean {
    if (!tx.id || !tx.fromAddress || !tx.toAddress || !tx.amount || !tx.tokenId) {
      return false;
    }

    if (tx.amount <= 0) {
      return false;
    }

    // Check if sender has sufficient balance (unless minting)
    if (tx.fromAddress !== 'MINTING_REWARD' && tx.fromAddress !== 'MINING_REWARD') {
      const senderBalance = this.getBalance(tx.fromAddress, tx.tokenId);
      if (senderBalance < tx.amount) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create and add a new block with pending transactions
   * Instant consensus - no mining
   */
  createBlock(minerAddress: string): Block {
    const lastBlock = this.getLatestBlock();
    const transactions = this.pendingTransactions.slice(0, 100);

    if (transactions.length === 0 && this.getChain().length > 1) {
      throw new Error('No pending transactions to block');
    }

    const block: Block = {
      index: this.getChain().length,
      timestamp: Date.now(),
      transactions,
      previousHash: lastBlock.hash,
      hash: '',
      nonce: 0,
      miner: minerAddress,
      difficulty: 1,
    };

    // Add mining reward
    const rewardTx: Transaction = {
      id: Crypto.randomId(),
      fromAddress: 'MINING_REWARD',
      toAddress: minerAddress,
      amount: 100,
      tokenId: 'NATIVE_TOKEN',
      timestamp: Date.now(),
    };

    block.transactions.push(rewardTx);
    block.hash = Crypto.hash(block);

    // Save to database
    this.db.saveBlock(block);

    // Update token state
    this.updateTokenState(block);

    // Mark transactions as confirmed
    this.pendingTransactions.forEach((tx) => {
      this.db.confirmTransaction(tx.id, block.hash);
    });

    // Clear pending
    this.pendingTransactions = [];

    this.emit('blockCreated', block);
    return block;
  }

  /**
   * Mint tokens instantly
   */
  mintTokens(toAddress: string, amount: number, tokenId: string): boolean {
    const tx: Transaction = {
      id: Crypto.randomId(),
      fromAddress: 'MINTING_REWARD',
      toAddress,
      amount,
      tokenId,
      timestamp: Date.now(),
    };

    if (!this.validateTransaction(tx)) {
      return false;
    }

    // Add to pending (will be included in next block)
    this.pendingTransactions.push(tx);
    this.db.saveTransaction(tx);

    // Update balance immediately for UI
    const currentBalance = this.getBalance(toAddress, tokenId);
    this.db.updateBalance(toAddress, tokenId, currentBalance + amount);

    this.emit('tokensMinted', { toAddress, amount, tokenId });
    return true;
  }

  /**
   * Burn tokens
   */
  burnTokens(fromAddress: string, amount: number, tokenId: string): boolean {
    const balance = this.getBalance(fromAddress, tokenId);
    if (balance < amount) {
      return false;
    }

    const tx: Transaction = {
      id: Crypto.randomId(),
      fromAddress,
      toAddress: 'BURN_ADDRESS',
      amount,
      tokenId,
      timestamp: Date.now(),
    };

    this.pendingTransactions.push(tx);
    this.db.saveTransaction(tx);

    // Update balance immediately
    this.db.updateBalance(fromAddress, tokenId, balance - amount);

    this.emit('tokensBurned', { fromAddress, amount, tokenId });
    return true;
  }

  /**
   * Get balance for an address and token
   */
  getBalance(address: string, tokenId: string): number {
    return this.db.getBalance(address, tokenId);
  }

  /**
   * Get all balances for an address
   */
  getAllBalances(address: string): Record<string, number> {
    return this.db.getAllBalances(address);
  }

  /**
   * Get chain statistics
   */
  getChainStats() {
    const chain = this.getChain();
    const stats = this.db.getStats();
    
    return {
      chainHeight: chain.length,
      totalTransactions: stats.transactions,
      pendingTransactions: this.pendingTransactions.length,
      totalAddresses: stats.addresses,
      difficulty: 1, // Instant consensus, no difficulty
      isValid: true, // Always valid in production mode
    };
  }

  /**
   * Update token state from a block
   */
  private updateTokenState(block: Block): void {
    for (const tx of block.transactions) {
      // Update sender balance
      if (tx.fromAddress !== 'MINTING_REWARD' && tx.fromAddress !== 'MINING_REWARD') {
        const senderBalance = this.getBalance(tx.fromAddress, tx.tokenId);
        this.db.updateBalance(tx.fromAddress, tx.tokenId, senderBalance - tx.amount);
      }

      // Update receiver balance
      if (tx.toAddress !== 'BURN_ADDRESS') {
        const receiverBalance = this.getBalance(tx.toAddress, tx.tokenId);
        this.db.updateBalance(tx.toAddress, tx.tokenId, receiverBalance + tx.amount);
      }
    }
  }

  /**
   * Check if blockchain is valid
   */
  isChainValid(): boolean {
    const chain = this.getChain();

    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      if (currentBlock.hash !== Crypto.hash(currentBlock)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Close database
   */
  close(): void {
    this.db.close();
  }
}
