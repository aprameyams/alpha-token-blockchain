/**
 * Core blockchain types and interfaces
 */

export interface Transaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenId: string;
  timestamp: number;
  signature?: string;
  data?: any; // For smart contracts
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  miner: string;
  difficulty: number;
}

export interface TokenState {
  [address: string]: {
    [tokenId: string]: number;
  };
}

export interface SmartContract {
  id: string;
  address: string;
  creator: string;
  code: string;
  state: any;
  balance: {
    [tokenId: string]: number;
  };
  createdAt: number;
  deploymentBlockHeight: number;
}

export interface ChainConfig {
  difficulty: number;
  blockTime: number; // milliseconds
  maxBlockSize: number;
  maxTransactionSize: number;
  rewardPerBlock: number;
  difficultyAdjustmentInterval: number;
}

export interface Node {
  id: string;
  host: string;
  port: number;
  connected: boolean;
}

export interface MiningReward {
  miner: string;
  amount: number;
  tokenId: string;
  blockHeight: number;
}
