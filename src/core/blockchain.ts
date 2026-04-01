import { EventEmitter } from 'events';
import { Block, Transaction, ChainConfig, TokenState, MiningReward } from './types';
import { Crypto } from './crypto';

/**
 * Main Blockchain implementation with Proof of Work consensus
 */
export class Blockchain extends EventEmitter {
  private chain: Block[] = [];
  private pendingTransactions: Transaction[] = [];
  private difficulty: number;
  private blockTime: number;
  private maxBlockSize: number;
  private rewardPerBlock: number;
  private tokenState: TokenState = {};
  private miningRewards: MiningReward[] = [];
  private config: ChainConfig;

  constructor(config?: Partial<ChainConfig>) {
    super();
    this.config = {
      difficulty: 4,
      blockTime: 10000, // 10 seconds
      maxBlockSize: 1000000, // 1MB
      maxTransactionSize: 50000,
      rewardPerBlock: 100,
      difficultyAdjustmentInterval: 10,
      ...config,
    };

    this.difficulty = this.config.difficulty;
    this.blockTime = this.config.blockTime;
    this.maxBlockSize = this.config.maxBlockSize;
    this.rewardPerBlock = this.config.rewardPerBlock;

    // Create genesis block
    this.createGenesisBlock();
  }

  /**
   * Create the first block in the chain
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
      difficulty: this.difficulty,
    };

    const proof = Crypto.findPoW(genesisBlock, this.difficulty);
    genesisBlock.nonce = proof.nonce;
    genesisBlock.hash = proof.hash;

    this.chain.push(genesisBlock);
    this.emit('blockCreated', genesisBlock);
  }

  /**
   * Get the latest block
   */
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Get the entire chain
   */
  getChain(): Block[] {
    return [...this.chain];
  }

  /**
   * Get block at specific height
   */
  getBlockByHeight(height: number): Block | null {
    return this.chain[height] || null;
  }

  /**
   * Get block by hash
   */
  getBlockByHash(hash: string): Block | null {
    return this.chain.find((b) => b.hash === hash) || null;
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
    // Validate transaction
    if (!this.validateTransaction(transaction)) {
      return false;
    }

    this.pendingTransactions.push(transaction);
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

    // Check if sender has sufficient balance
    const senderBalance = this.getBalance(tx.fromAddress, tx.tokenId);
    if (senderBalance < tx.amount) {
      return false;
    }

    // Verify signature if present
    if (tx.signature) {
      const message = `${tx.fromAddress}${tx.toAddress}${tx.amount}${tx.tokenId}${tx.timestamp}`;
      if (!Crypto.verify(message, tx.signature, tx.fromAddress)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Mine a new block
   */
  minePendingTransactions(minerAddress: string): Block {
    if (this.pendingTransactions.length === 0 && this.chain.length > 1) {
      throw new Error('No pending transactions to mine');
    }

    const block: Block = {
      index: this.chain.length,
      timestamp: Date.now(),
      transactions: this.pendingTransactions.slice(0, 100), // Max 100 tx per block
      previousHash: this.getLatestBlock().hash,
      hash: '',
      nonce: 0,
      miner: minerAddress,
      difficulty: this.difficulty,
    };

    // Add mining reward transaction
    const rewardTx: Transaction = {
      id: Crypto.randomId(),
      fromAddress: 'MINING_REWARD',
      toAddress: minerAddress,
      amount: this.rewardPerBlock,
      tokenId: 'NATIVE_TOKEN',
      timestamp: Date.now(),
    };

    block.transactions.push(rewardTx);

    // Perform proof of work
    console.log(`Mining block ${block.index} with difficulty ${this.difficulty}...`);
    const proof = Crypto.findPoW(block, this.difficulty);
    block.nonce = proof.nonce;
    block.hash = proof.hash;

    // Validate and add to chain
    if (this.validateBlock(block)) {
      this.chain.push(block);

      // Update token state
      this.updateTokenState(block);

      // Remove mined transactions from pending pool
      this.pendingTransactions = this.pendingTransactions.slice(
        block.transactions.length - 1
      );

      // Adjust difficulty
      this.adjustDifficulty();

      this.emit('blockMined', block);
      this.emit('blockCreated', block);

      return block;
    } else {
      throw new Error('Mined block failed validation');
    }
  }

  /**
   * Validate a block
   */
  private validateBlock(block: Block): boolean {
    // Check if previous block exists
    if (
      block.index > 0 &&
      (!this.chain[block.index - 1] ||
        this.chain[block.index - 1].hash !== block.previousHash)
    ) {
      console.log('❌ Validation failed: Previous hash mismatch');
      console.log('  Expected:', this.chain[block.index - 1]?.hash);
      console.log('  Got:', block.previousHash);
      return false;
    }

    // Check if proof of work is valid
    if (!Crypto.verifyPoW(block, block.nonce, block.hash, block.difficulty)) {
      console.log('❌ Validation failed: Invalid proof of work');
      console.log('  Block hash:', block.hash);
      console.log('  Block nonce:', block.nonce);
      return false;
    }

    // Validate all transactions
    for (const tx of block.transactions) {
      if (!this.validateTransaction(tx)) {
        // Mining reward transactions are always valid
        if (tx.fromAddress !== 'MINING_REWARD') {
          console.log('❌ Validation failed: Invalid transaction');
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Update token state after a block is added
   */
  private updateTokenState(block: Block): void {
    for (const tx of block.transactions) {
      if (!this.tokenState[tx.fromAddress]) {
        this.tokenState[tx.fromAddress] = {};
      }
      if (!this.tokenState[tx.toAddress]) {
        this.tokenState[tx.toAddress] = {};
      }

      const fromBalance = this.tokenState[tx.fromAddress][tx.tokenId] || 0;
      const toBalance = this.tokenState[tx.toAddress][tx.tokenId] || 0;

      this.tokenState[tx.fromAddress][tx.tokenId] = fromBalance - tx.amount;
      this.tokenState[tx.toAddress][tx.tokenId] = toBalance + tx.amount;
    }
  }

  /**
   * Get balance of an address for a token
   */
  getBalance(address: string, tokenId: string): number {
    return this.tokenState[address]?.[tokenId] || 0;
  }

  /**
   * Get all balances of an address
   */
  getAllBalances(address: string): { [tokenId: string]: number } {
    return this.tokenState[address] || {};
  }

  /**
   * Mint new tokens
   */
  mintTokens(toAddress: string, tokenId: string, amount: number): Transaction {
    const transaction: Transaction = {
      id: Crypto.randomId(),
      fromAddress: 'MINT',
      toAddress,
      amount,
      tokenId,
      timestamp: Date.now(),
    };

    if (!this.tokenState[toAddress]) {
      this.tokenState[toAddress] = {};
    }

    this.tokenState[toAddress][tokenId] =
      (this.tokenState[toAddress][tokenId] || 0) + amount;

    this.emit('tokensMinted', { toAddress, tokenId, amount });
    return transaction;
  }

  /**
   * Burn tokens
   */
  burnTokens(fromAddress: string, tokenId: string, amount: number): boolean {
    const balance = this.getBalance(fromAddress, tokenId);
    if (balance < amount) {
      return false;
    }

    this.tokenState[fromAddress][tokenId] -= amount;
    this.emit('tokensBurned', { fromAddress, tokenId, amount });
    return true;
  }

  /**
   * Get current difficulty
   */
  getDifficulty(): number {
    return this.difficulty;
  }

  /**
   * Adjust difficulty based on block time
   */
  private adjustDifficulty(): void {
    if (this.chain.length % this.config.difficultyAdjustmentInterval !== 0) {
      return;
    }

    const lastBlocks = this.chain.slice(
      -this.config.difficultyAdjustmentInterval
    );
    const avgBlockTime =
      (lastBlocks[lastBlocks.length - 1].timestamp - lastBlocks[0].timestamp) /
      this.config.difficultyAdjustmentInterval;

    if (avgBlockTime > this.blockTime) {
      this.difficulty = Math.max(1, this.difficulty - 1);
    } else if (avgBlockTime < this.blockTime) {
      this.difficulty += 1;
    }

    this.emit('difficultyAdjusted', this.difficulty);
  }

  /**
   * Validate the entire chain
   */
  isValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      if (
        !Crypto.verifyPoW(
          currentBlock,
          currentBlock.nonce,
          currentBlock.hash,
          currentBlock.difficulty
        )
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get chain statistics
   */
  getStats() {
    return {
      height: this.chain.length,
      totalTransactions: this.chain.reduce((sum, b) => sum + b.transactions.length, 0),
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty,
      isValid: this.isValid(),
      totalAddresses: Object.keys(this.tokenState).length,
    };
  }

  /**
   * Clear the blockchain (for testing)
   */
  reset(): void {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = this.config.difficulty;
    this.tokenState = {};
    this.miningRewards = [];
    this.createGenesisBlock();
  }
}
