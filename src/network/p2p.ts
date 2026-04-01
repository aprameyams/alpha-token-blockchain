import { EventEmitter } from 'events';
import { Blockchain } from '../core/blockchain';
import { Block, Transaction } from '../core/types';
import { Crypto } from '../core/crypto';

/**
 * P2P Network node for blockchain synchronization
 */
export class P2PNode extends EventEmitter {
  private nodeId: string;
  private blockchain: Blockchain;
  private peers: Map<string, PeerInfo> = new Map();
  private port: number;
  private host: string;

  constructor(blockchain: Blockchain, host: string = 'localhost', port: number = 8000) {
    super();
    this.nodeId = Crypto.randomId();
    this.blockchain = blockchain;
    this.host = host;
    this.port = port;

    // Setup blockchain event listeners
    this.setupBlockchainListeners();
  }

  /**
   * Setup listeners for blockchain events
   */
  private setupBlockchainListeners(): void {
    this.blockchain.on('blockMined', (block: Block) => {
      this.broadcastBlock(block);
    });

    this.blockchain.on('transactionAdded', (tx: Transaction) => {
      this.broadcastTransaction(tx);
    });
  }

  /**
   * Get node ID
   */
  getNodeId(): string {
    return this.nodeId;
  }

  /**
   * Get node info
   */
  getNodeInfo() {
    return {
      nodeId: this.nodeId,
      host: this.host,
      port: this.port,
      peers: this.peers.size,
      chainHeight: this.blockchain.getChain().length,
      pendingTransactions: this.blockchain.getPendingTransactions().length,
    };
  }

  /**
   * Connect to a peer node
   */
  connectToPeer(peerId: string, host: string, port: number): boolean {
    if (this.peers.has(peerId)) {
      return false; // Already connected
    }

    const peerInfo: PeerInfo = {
      id: peerId,
      host,
      port,
      connected: true,
      lastSeen: Date.now(),
      version: 1,
    };

    this.peers.set(peerId, peerInfo);
    this.emit('peerConnected', peerInfo);

    // Request chain sync from peer
    this.requestChainSync(peerId);

    return true;
  }

  /**
   * Disconnect from a peer
   */
  disconnectPeer(peerId: string): boolean {
    const peer = this.peers.get(peerId);
    if (!peer) {
      return false;
    }

    peer.connected = false;
    this.emit('peerDisconnected', peerId);
    return true;
  }

  /**
   * Get all connected peers
   */
  getPeers(): PeerInfo[] {
    return Array.from(this.peers.values()).filter((p) => p.connected);
  }

  /**
   * Broadcast a block to all peers
   */
  broadcastBlock(block: Block): void {
    const message: NetworkMessage = {
      type: 'BLOCK',
      sender: this.nodeId,
      timestamp: Date.now(),
      payload: block,
    };

    this.broadcast(message);
  }

  /**
   * Broadcast a transaction to all peers
   */
  broadcastTransaction(tx: Transaction): void {
    const message: NetworkMessage = {
      type: 'TRANSACTION',
      sender: this.nodeId,
      timestamp: Date.now(),
      payload: tx,
    };

    this.broadcast(message);
  }

  /**
   * Broadcast a message to all peers
   */
  private broadcast(message: NetworkMessage): void {
    for (const peer of this.getPeers()) {
      this.sendToPeer(peer.id, message);
    }
  }

  /**
   * Send a message to a specific peer
   */
  private sendToPeer(peerId: string, message: NetworkMessage): void {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connected) {
      return;
    }

    // In a real implementation, this would use WebSocket or HTTP
    this.emit('messageSent', { peer: peerId, message });
  }

  /**
   * Receive a message from a peer
   */
  receiveMessage(message: NetworkMessage): void {
    // Update peer last seen
    const peer = this.peers.get(message.sender);
    if (peer) {
      peer.lastSeen = Date.now();
    }

    switch (message.type) {
      case 'BLOCK':
        this.handleBlockMessage(message);
        break;
      case 'TRANSACTION':
        this.handleTransactionMessage(message);
        break;
      case 'CHAIN_REQUEST':
        this.handleChainRequest(message);
        break;
      case 'CHAIN_RESPONSE':
        this.handleChainResponse(message);
        break;
      case 'PEER_INFO':
        this.handlePeerInfo(message);
        break;
    }
  }

  /**
   * Handle received block
   */
  private handleBlockMessage(message: NetworkMessage): void {
    const block = message.payload as Block;

    // Verify block is not from this node
    if (block.miner === this.nodeId) {
      return;
    }

    // Validate block before adding
    const currentHeight = this.blockchain.getChain().length;
    if (block.index === currentHeight) {
      // This is the next block in sequence
      this.emit('blockReceived', block);
    } else if (block.index > currentHeight) {
      // We're behind, request sync
      this.requestChainSync(message.sender);
    }
  }

  /**
   * Handle received transaction
   */
  private handleTransactionMessage(message: NetworkMessage): void {
    const tx = message.payload as Transaction;

    if (!this.blockchain.getPendingTransactions().find((t) => t.id === tx.id)) {
      if (this.blockchain.addTransaction(tx)) {
        // Relay to other peers
        this.broadcastTransaction(tx);
      }
    }
  }

  /**
   * Request chain synchronization
   */
  private requestChainSync(peerId: string): void {
    const message: NetworkMessage = {
      type: 'CHAIN_REQUEST',
      sender: this.nodeId,
      timestamp: Date.now(),
      payload: {
        from: 0,
        to: -1, // All blocks
      },
    };

    this.sendToPeer(peerId, message);
  }

  /**
   * Handle chain request
   */
  private handleChainRequest(message: NetworkMessage): void {
    const { from, to } = message.payload;
    const chain = this.blockchain.getChain();

    const endIndex = to === -1 ? chain.length : Math.min(to + 1, chain.length);
    const blocks = chain.slice(from, endIndex);

    const response: NetworkMessage = {
      type: 'CHAIN_RESPONSE',
      sender: this.nodeId,
      timestamp: Date.now(),
      payload: {
        blocks,
        total: chain.length,
      },
    };

    this.sendToPeer(message.sender, response);
  }

  /**
   * Handle chain response
   */
  private handleChainResponse(message: NetworkMessage): void {
    const { blocks } = message.payload;

    // Validate and add blocks
    for (const block of blocks) {
      if (
        block.index === this.blockchain.getChain().length &&
        !this.blockchain.getChain().find((b) => b.hash === block.hash)
      ) {
        // Valid next block, would process here
        this.emit('blockReceived', block);
      }
    }
  }

  /**
   * Handle peer info
   */
  private handlePeerInfo(message: NetworkMessage): void {
    const peerInfo = message.payload;
    const peer = this.peers.get(message.sender);
    if (peer) {
      peer.lastSeen = Date.now();
    }
  }

  /**
   * Get network stats
   */
  getNetworkStats() {
    const connectedPeers = this.getPeers();
    return {
      nodeId: this.nodeId,
      connectedPeerCount: connectedPeers.length,
      totalPeerCount: this.peers.size,
      peers: connectedPeers.map((p) => ({
        id: p.id,
        host: p.host,
        port: p.port,
      })),
    };
  }
}

export interface PeerInfo {
  id: string;
  host: string;
  port: number;
  connected: boolean;
  lastSeen: number;
  version: number;
}

export interface NetworkMessage {
  type: 'BLOCK' | 'TRANSACTION' | 'CHAIN_REQUEST' | 'CHAIN_RESPONSE' | 'PEER_INFO';
  sender: string;
  timestamp: number;
  payload: any;
}
