import fs from 'fs';
import path from 'path';

/**
 * Simple File-Based Database for MVP
 * Stores blockchain data as JSON files for instant launch
 */
export class BlockchainDatabase {
  private dataPath: string;
  private blocksFile: string;
  private transactionsFile: string;
  private balancesFile: string;
  private isReady: boolean = true;

  constructor(dataPath: string = './data') {
    this.dataPath = dataPath;
    this.blocksFile = path.join(dataPath, 'blocks.json');
    this.transactionsFile = path.join(dataPath, 'transactions.json');
    this.balancesFile = path.join(dataPath, 'balances.json');

    // Ensure directory exists
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }

    // Initialize files if they don't exist
    this.initializeFiles();
  }

  private initializeFiles(): void {
    if (!fs.existsSync(this.blocksFile)) {
      fs.writeFileSync(this.blocksFile, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.transactionsFile)) {
      fs.writeFileSync(this.transactionsFile, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.balancesFile)) {
      fs.writeFileSync(this.balancesFile, JSON.stringify({}, null, 2));
    }
  }

  /**
   * Save a block
   */
  saveBlock(block: any): void {
    try {
      const blocks = this.readFile(this.blocksFile) || [];
      blocks.push(block);
      fs.writeFileSync(this.blocksFile, JSON.stringify(blocks, null, 2));
    } catch (e) {
      console.error('Error saving block:', e);
    }
  }

  /**
   * Get block by index
   */
  getBlock(index: number): any {
    try {
      const blocks = this.readFile(this.blocksFile) || [];
      return blocks.find((b: any) => b.index === index) || null;
    } catch (e) {
      console.error('Error getting block:', e);
      return null;
    }
  }

  /**
   * Get all blocks
   */
  getBlocks(): any[] {
    try {
      return this.readFile(this.blocksFile) || [];
    } catch (e) {
      console.error('Error getting blocks:', e);
      return [];
    }
  }

  /**
   * Get block by index (alias)
   */
  getBlockByIndex(index: number): any {
    return this.getBlock(index);
  }

  /**
   * Get all blocks (alias)
   */
  getAllBlocks(): any[] {
    return this.getBlocks();
  }

  /**
   * Get latest block
   */
  getLatestBlock(): any {
    try {
      const blocks = this.getBlocks();
      return blocks.length > 0 ? blocks[blocks.length - 1] : null;
    } catch (e) {
      console.error('Error getting latest block:', e);
      return null;
    }
  }

  /**
   * Get block by hash
   */
  getBlockByHash(hash: string): any {
    try {
      const blocks = this.getBlocks();
      return blocks.find((b: any) => b.hash === hash) || null;
    } catch (e) {
      console.error('Error getting block by hash:', e);
      return null;
    }
  }

  /**
   * Save transaction
   */
  saveTransaction(tx: any): void {
    try {
      const txs = this.readFile(this.transactionsFile) || [];
      txs.push(tx);
      fs.writeFileSync(this.transactionsFile, JSON.stringify(txs, null, 2));
    } catch (e) {
      console.error('Error saving transaction:', e);
    }
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): any[] {
    try {
      const txs = this.readFile(this.transactionsFile) || [];
      return txs.filter((t: any) => t.status === 'pending');
    } catch (e) {
      console.error('Error getting pending transactions:', e);
      return [];
    }
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(txId: string, status: string, blockIndex?: number): void {
    try {
      const txs = this.readFile(this.transactionsFile) || [];
      const tx = txs.find((t: any) => t.id === txId);
      if (tx) {
        tx.status = status;
        if (blockIndex !== undefined) {
          tx.blockIndex = blockIndex;
        }
      }
      fs.writeFileSync(this.transactionsFile, JSON.stringify(txs, null, 2));
    } catch (e) {
      console.error('Error updating transaction status:', e);
    }
  }

  /**
   * Confirm transaction
   */
  confirmTransaction(txId: string, blockHash: string): void {
    this.updateTransactionStatus(txId, 'confirmed');
  }

  /**
   * Get token balance
   */
  getBalance(address: string, tokenId: string): number {
    try {
      const balances = this.readFile(this.balancesFile) || {};
      const key = `${address}:${tokenId}`;
      return balances[key] || 0;
    } catch (e) {
      console.error('Error getting balance:', e);
      return 0;
    }
  }

  /**
   * Update balance
   */
  updateBalance(address: string, tokenId: string, balance: number): void {
    try {
      const balances = this.readFile(this.balancesFile) || {};
      const key = `${address}:${tokenId}`;
      balances[key] = balance;
      fs.writeFileSync(this.balancesFile, JSON.stringify(balances, null, 2));
    } catch (e) {
      console.error('Error updating balance:', e);
    }
  }

  /**
   * Get all balances for address
   */
  getAllBalances(address: string): Record<string, number> {
    try {
      const balances = this.readFile(this.balancesFile) || {};
      const result: Record<string, number> = {};

      for (const [key, value] of Object.entries(balances)) {
        if (key.startsWith(address + ':')) {
          const tokenId = key.split(':')[1];
          result[tokenId] = value as number;
        }
      }

      return result;
    } catch (e) {
      console.error('Error getting all balances:', e);
      return {};
    }
  }

  /**
   * Get chain statistics
   */
  getChainStats(): any {
    try {
      const blocks = this.getBlocks();
      const txs = this.readFile(this.transactionsFile) || [];
      const balances = this.readFile(this.balancesFile) || {};

      // Calculate token supplies
      const supplies: Record<string, number> = {};
      for (const [_, value] of Object.entries(balances)) {
        const parts = _ as string;
        const tokenId = parts?.split(':')[1];
        if (tokenId) {
          supplies[tokenId] = (supplies[tokenId] || 0) + (value as number);
        }
      }

      return {
        blockCount: blocks.length,
        transactionCount: txs.length,
        tokenSupplies: supplies,
        latestBlock: blocks.length > 0 ? { index: blocks[blocks.length - 1].index, hash: blocks[blocks.length - 1].hash } : null,
      };
    } catch (e) {
      console.error('Error getting chain stats:', e);
      return {
        blockCount: 0,
        transactionCount: 0,
        tokenSupplies: {},
        latestBlock: null,
      };
    }
  }

  /**
   * Get stats (alias)
   */
  getStats(): any {
    return this.getChainStats();
  }

  /**
   * Private helper to read JSON file
   */
  private readFile(filePath: string): any {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e);
    }
    return null;
  }

  /**
   * Close (no-op for file-based storage)
   */
  close(): void {
    // No resources to close for file-based storage
  }
}
