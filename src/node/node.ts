import { ProductionBlockchain } from '../core/productionBlockchain';
import { SmartContractVM } from '../core/smartContract';
import { Crypto } from '../core/crypto';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Production Node Runner - Simplified for MVP with Instant Consensus
 */
class Node {
  private blockchain: ProductionBlockchain;
  private app: express.Application;
  private contractVM: SmartContractVM;
  private port: number;

  constructor() {
    // Initialize production blockchain with SQLite persistence
    this.blockchain = new ProductionBlockchain();
    this.contractVM = new SmartContractVM();
    this.port = parseInt(process.env.API_PORT || '3000');

    const express_module = require('express');
    this.app = express_module();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventListeners();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(bodyParser.json({ limit: '50mb' }));
    this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  }

  private setupRoutes(): void {
    // Root
    this.app.get('/', (req: any, res: any) => {
      res.json({
        name: 'ALPHA TOKEN Blockchain',
        version: '1.0.0',
        status: 'running',
        timestamp: Date.now(),
      });
    });

    // Health check
    this.app.get('/health', (req: any, res: any) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Blockchain info
    this.app.get('/blockchain/info', (req: any, res: any) => {
      const stats = this.blockchain.getChainStats();
      res.json(stats);
    });

    // Get chain
    this.app.get('/blockchain/chain', (req: any, res: any) => {
      const chain = this.blockchain.getChain();
      res.json(chain);
    });

    // Get block by height
    this.app.get('/blockchain/block/:height', (req: any, res: any) => {
      const height = parseInt(req.params.height);
      const block = this.blockchain.getBlockByHeight(height);
      if (block) {
        res.json(block);
      } else {
        res.status(404).json({ error: 'Block not found' });
      }
    });

    // Pending transactions
    this.app.get('/transactions/pending', (req: any, res: any) => {
      const pending = this.blockchain.getPendingTransactions();
      res.json(pending);
    });

    // Create transaction
    this.app.post('/transactions', (req: any, res: any) => {
      const { fromAddress, toAddress, amount, tokenId } = req.body;

      if (!fromAddress || !toAddress || !amount || !tokenId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const tx: any = {
        id: Crypto.randomId(),
        fromAddress,
        toAddress,
        amount: parseFloat(amount),
        tokenId,
        timestamp: Date.now(),
      };

      const success = this.blockchain.addTransaction(tx);
      if (success) {
        res.json({ success: true, transaction: tx });
      } else {
        res.status(400).json({ error: 'Transaction validation failed' });
      }
    });

    // Get balance
    this.app.get('/balance/:address/:tokenId?', (req: any, res: any) => {
      const { address, tokenId } = req.params;

      if (tokenId) {
        const balance = this.blockchain.getBalance(address, tokenId);
        res.json({
          address,
          tokenId,
          balance,
        });
      } else {
        const balances = this.blockchain.getAllBalances(address);
        res.json({
          address,
          balances,
        });
      }
    });

    // Mint tokens
    this.app.post('/mint', (req: any, res: any) => {
      const { toAddress, amount, tokenId } = req.body;

      if (!toAddress || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const success = this.blockchain.mintTokens(
        toAddress,
        parseFloat(amount),
        tokenId || 'ALPHA_TOKEN'
      );
      if (success) {
        res.json({
          success: true,
          to: toAddress,
          amount,
          token: tokenId || 'ALPHA_TOKEN',
        });
      } else {
        res.status(400).json({ error: 'Minting failed' });
      }
    });

    // Create block
    this.app.post('/mining/mine', (req: any, res: any) => {
      const { minerAddress } = req.body;

      if (!minerAddress) {
        return res.status(400).json({ error: 'Miner address required' });
      }

      try {
        const block = this.blockchain.createBlock(minerAddress);
        res.json({
          success: true,
          block,
        });
      } catch (e: any) {
        res.status(400).json({ error: e.message });
      }
    });

    // Generate keypair
    this.app.get('/crypto/keygen', (req: any, res: any) => {
      const { publicKey, privateKey } = Crypto.generateKeyPair();
      const address = Crypto.hash(publicKey).substring(0, 40);

      res.json({
        address: '0x' + address,
        publicKey,
        privateKey,
      });
    });

    // Set of simple routes
    this.app.all('*', (req: any, res: any) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  private setupEventListeners(): void {
    this.blockchain.on('blockCreated', (block: any) => {
      console.log(`📦 New block created: #${block.index}`);
    });

    this.blockchain.on('tokensMinted', (data: any) => {
      console.log(
        `💰 Tokens minted: ${data.amount} ${data.tokenId} to ${data.toAddress.substring(0, 8)}...`
      );
    });

    this.blockchain.on('transactionAdded', (tx: any) => {
      console.log(`💸 Transaction pending`);
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log('🚀 Starting ALPHA TOKEN blockchain...');
        console.log(`✅ API Server listening on http://localhost:${this.port}`);
        console.log(`📊 Blockchain Status: Ready for operations`);
        console.log(`💾 Data persisted in SQLite database`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping node...');
    this.blockchain.close();
  }
}

// Run the node
if (require.main === module) {
  const node = new Node();
  node.start().catch((e) => {
    console.error('Error starting node:', e);
    process.exit(1);
  });
}

export default Node;
