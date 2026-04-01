import { SmartContract, Transaction } from './types';
import { Crypto } from './crypto';

/**
 * Simple Smart Contract Virtual Machine
 */
export class SmartContractVM {
  private contracts: Map<string, SmartContract> = new Map();
  private contractState: Map<string, any> = new Map();

  /**
   * Deploy a smart contract
   */
  deployContract(
    creator: string,
    code: string,
    initialState: any = {}
  ): SmartContract {
    const address = Crypto.randomId().substring(0, 40);
    const contract: SmartContract = {
      id: Crypto.randomId(),
      address,
      creator,
      code,
      state: initialState,
      balance: {},
      createdAt: Date.now(),
      deploymentBlockHeight: 0,
    };

    this.contracts.set(address, contract);
    this.contractState.set(address, initialState);

    return contract;
  }

  /**
   * Get a contract
   */
  getContract(address: string): SmartContract | null {
    return this.contracts.get(address) || null;
  }

  /**
   * Call a contract function
   */
  callContractFunction(
    contractAddress: string,
    functionName: string,
    args: any[],
    sender: string
  ): any {
    const contract = this.contracts.get(contractAddress);
    if (!contract) {
      throw new Error(`Contract not found: ${contractAddress}`);
    }

    try {
      // Create a sandboxed context
      const context = {
        state: this.contractState.get(contractAddress),
        balance: contract.balance,
        sender,
        address: contractAddress,
        call: this.callContractFunction.bind(this),
      };

      // Execute the function code
      const func = new Function(
        'context',
        'args',
        `return (${contract.code})[${JSON.stringify(functionName)}](...args)`
      );

      const result = func(context, args);

      // Update state if modified
      this.contractState.set(contractAddress, context.state);

      return result;
    } catch (error) {
      throw new Error(`Contract execution failed: ${error}`);
    }
  }

  /**
   * Transfer tokens to a contract
   */
  transferToContract(
    contractAddress: string,
    tokenId: string,
    amount: number
  ): boolean {
    const contract = this.contracts.get(contractAddress);
    if (!contract) {
      return false;
    }

    if (!contract.balance[tokenId]) {
      contract.balance[tokenId] = 0;
    }

    contract.balance[tokenId] += amount;
    return true;
  }

  /**
   * Get contract balance
   */
  getContractBalance(contractAddress: string, tokenId: string): number {
    const contract = this.contracts.get(contractAddress);
    return contract?.balance[tokenId] || 0;
  }

  /**
   * Create a transaction for contract execution
   */
  createContractTransaction(
    caller: string,
    contractAddress: string,
    functionName: string,
    args: any[],
    amount: number = 0,
    tokenId: string = 'NATIVE_TOKEN'
  ): Transaction {
    return {
      id: Crypto.randomId(),
      fromAddress: caller,
      toAddress: contractAddress,
      amount,
      tokenId,
      timestamp: Date.now(),
      data: {
        type: 'contract_call',
        contractAddress,
        functionName,
        args,
      },
    };
  }

  /**
   * Get all contracts
   */
  getAllContracts(): SmartContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Get contract state
   */
  getContractState(contractAddress: string): any {
    return this.contractState.get(contractAddress);
  }

  /**
   * Example contract templates
   */
  static getTokenContractTemplate(): string {
    return `
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
      },
      
      getTotalSupply() {
        return this.state.totalSupply;
      }
    }
    `;
  }

  static getMultiSigContractTemplate(): string {
    return `
    {
      initialize(signers, requiredSignatures) {
        this.state.signers = signers;
        this.state.requiredSignatures = requiredSignatures;
        this.state.pending = {};
        return { success: true };
      },
      
      submitTransaction(to, amount) {
        const id = Math.random().toString(36);
        this.state.pending[id] = {
          to,
          amount,
          signatures: [context.sender],
          executed: false
        };
        return { success: true, transactionId: id };
      },
      
      approveTransaction(txId) {
        const tx = this.state.pending[txId];
        if (!tx || tx.executed) {
          throw new Error('Invalid transaction');
        }
        if (!tx.signatures.includes(context.sender)) {
          tx.signatures.push(context.sender);
        }
        if (tx.signatures.length >= this.state.requiredSignatures) {
          tx.executed = true;
        }
        return { success: true, approved: tx.signatures.length };
      },
      
      getPendingTransaction(txId) {
        return this.state.pending[txId];
      }
    }
    `;
  }
}
