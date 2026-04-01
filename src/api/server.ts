import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { Blockchain } from '../core/blockchain';
import { P2PNode } from '../network/p2p';
import { Crypto } from '../core/crypto';
import { Transaction } from '../core/types';
import { SmartContractVM } from '../core/smartContract';
import { authRouter } from '../core/authRoutes';

/**
 * REST API Server for blockchain interaction
 */
export class APIServer {
  private app: express.Application;
  private blockchain: Blockchain;
  private p2pNode: P2PNode;
  private contractVM: SmartContractVM;
  private port: number;

  constructor(
    blockchain: Blockchain,
    p2pNode: P2PNode,
    contractVM: SmartContractVM,
    port: number = 3000
  ) {
    this.blockchain = blockchain;
    this.p2pNode = p2pNode;
    this.contractVM = contractVM;
    this.port = port;

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(bodyParser.json({ limit: '50mb' }));
    this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    // Serve static files from public directory
    const publicPath = path.join(process.cwd(), 'src', 'public');
    this.app.use(express.static(publicPath));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Auth routes
    this.app.use('/auth', authRouter);

    // Note: Root / is served by express.static middleware (index.html)
    // No explicit route needed here - let static files handle it

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'OK',
        timestamp: Date.now(),
        chainHeight: this.blockchain.getChain().length,
      });
    });

    // Blockchain info
    this.app.get('/blockchain/info', (req: Request, res: Response) => {
      res.json({
        stats: this.blockchain.getStats(),
        difficulty: this.blockchain.getDifficulty(),
        chain: {
          height: this.blockchain.getChain().length,
          isValid: this.blockchain.isValid(),
        },
      });
    });

    // Get chain
    this.app.get('/blockchain/chain', (req: Request, res: Response) => {
      const chain = this.blockchain.getChain();
      res.json(chain);
    });

    // Get block by height
    this.app.get('/blockchain/block/:height', (req: Request, res: Response) => {
      const block = this.blockchain.getBlockByHeight(parseInt(req.params.height));
      if (block) {
        res.json(block);
      } else {
        res.status(404).json({ error: 'Block not found' });
      }
    });

    // Get block by hash
    this.app.get('/blockchain/block-hash/:hash', (req: Request, res: Response) => {
      const block = this.blockchain.getBlockByHash(req.params.hash);
      if (block) {
        res.json(block);
      } else {
        res.status(404).json({ error: 'Block not found' });
      }
    });

    // Get pending transactions
    this.app.get('/transactions/pending', (req: Request, res: Response) => {
      res.json(this.blockchain.getPendingTransactions());
    });

    // Create transaction
    this.app.post('/transactions', (req: Request, res: Response) => {
      try {
        const { fromAddress, toAddress, amount, tokenId, signature } = req.body;

        const transaction: Transaction = {
          id: Crypto.randomId(),
          fromAddress,
          toAddress,
          amount,
          tokenId: tokenId || 'NATIVE_TOKEN',
          timestamp: Date.now(),
          signature,
        };

        if (this.blockchain.addTransaction(transaction)) {
          res.status(201).json({
            success: true,
            transaction,
            message: 'Transaction added to pool',
          });
        } else {
          res.status(400).json({
            success: false,
            error: 'Transaction validation failed',
          });
        }
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Get balance
    this.app.get('/balance/:address/:tokenId', (req: Request, res: Response) => {
      const balance = this.blockchain.getBalance(req.params.address, req.params.tokenId);
      res.json({
        address: req.params.address,
        tokenId: req.params.tokenId,
        balance,
      });
    });

    // Get all balances
    this.app.get('/balance/:address', (req: Request, res: Response) => {
      const balances = this.blockchain.getAllBalances(req.params.address);
      res.json({
        address: req.params.address,
        balances,
      });
    });

    // Mint tokens (admin only)
    this.app.post('/mint', (req: Request, res: Response) => {
      try {
        const { toAddress, tokenId, amount } = req.body;
        this.blockchain.mintTokens(toAddress, tokenId, amount);
        res.json({
          success: true,
          message: 'Tokens minted',
          toAddress,
          tokenId,
          amount,
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Burn tokens
    this.app.post('/burn', (req: Request, res: Response) => {
      try {
        const { fromAddress, tokenId, amount } = req.body;
        const success = this.blockchain.burnTokens(fromAddress, tokenId, amount);
        if (success) {
          res.json({
            success: true,
            message: 'Tokens burned',
            fromAddress,
            tokenId,
            amount,
          });
        } else {
          res.status(400).json({
            success: false,
            error: 'Insufficient balance',
          });
        }
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Generate key pair
    this.app.get('/crypto/keypair', (req: Request, res: Response) => {
      const keyPair = Crypto.generateKeyPair();
      const address = Crypto.publicKeyToAddress(keyPair.publicKey);
      res.json({
        ...keyPair,
        address,
      });
    });

    // Sign message
    this.app.post('/crypto/sign', (req: Request, res: Response) => {
      try {
        const { message, privateKey } = req.body;
        const signature = Crypto.sign(message, privateKey);
        res.json({ signature });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Verify signature
    this.app.post('/crypto/verify', (req: Request, res: Response) => {
      try {
        const { message, signature, publicKey } = req.body;
        const isValid = Crypto.verify(message, signature, publicKey);
        res.json({ isValid });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Smart Contracts
    this.app.post('/contracts/deploy', (req: Request, res: Response) => {
      try {
        const { creator, code, initialState } = req.body;
        const contract = this.contractVM.deployContract(creator, code, initialState);
        res.status(201).json({
          success: true,
          contract,
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.get('/contracts/:address', (req: Request, res: Response) => {
      const contract = this.contractVM.getContract(req.params.address);
      if (contract) {
        res.json(contract);
      } else {
        res.status(404).json({ error: 'Contract not found' });
      }
    });

    this.app.post('/contracts/:address/call', (req: Request, res: Response) => {
      try {
        const { functionName, args, sender } = req.body;
        const result = this.contractVM.callContractFunction(
          req.params.address,
          functionName,
          args,
          sender
        );
        res.json({
          success: true,
          result,
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Network info
    this.app.get('/network/info', (req: Request, res: Response) => {
      res.json(this.p2pNode.getNetworkStats());
    });

    this.app.get('/network/node', (req: Request, res: Response) => {
      res.json(this.p2pNode.getNodeInfo());
    });

    // Connect to peer
    this.app.post('/network/peers', (req: Request, res: Response) => {
      try {
        const { peerId, host, port } = req.body;
        const success = this.p2pNode.connectToPeer(peerId, host, port);
        res.json({
          success,
          message: success ? 'Connected to peer' : 'Failed to connect to peer',
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    this.app.get('/network/peers', (req: Request, res: Response) => {
      res.json(this.p2pNode.getPeers());
    });

    // Error handling middleware
    this.app.use((err: any, req: Request, res: Response, next: any) => {
      console.error(err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message,
      });
    });
  }

  /**
   * Start the server
   */
  start(): void {
    this.app.listen(this.port, () => {
      console.log(`API Server listening on http://localhost:${this.port}`);
    });
  }

  /**
   * Get Express app instance
   */
  getApp(): express.Application {
    return this.app;
  }
}
