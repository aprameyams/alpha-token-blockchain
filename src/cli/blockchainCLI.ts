import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import table from 'table';
import { Blockchain } from '../core/blockchain';
import { Crypto } from '../core/crypto';
import { Transaction } from '../core/types';
import { SmartContractVM } from '../core/smartContract';

/**
 * CLI for blockchain management
 */
export class BlockchainCLI {
  private blockchain: Blockchain;
  private contractVM: SmartContractVM;

  constructor(blockchain: Blockchain, contractVM: SmartContractVM) {
    this.blockchain = blockchain;
    this.contractVM = contractVM;
  }

  /**
   * Setup CLI commands
   */
  setup(): any {
    return yargs(hideBin(process.argv))
      .command(
        'info',
        'Get blockchain information',
        {},
        () => this.handleInfo()
      )
      .command(
        'chain',
        'Display the entire blockchain',
        { limit: { alias: 'l', type: 'number', default: 10 } },
        (argv) => this.handleChain(argv.limit as number)
      )
      .command(
        'balance <address> [tokenId]',
        'Get balance of an address',
        (yargs) => yargs
          .positional('address', { type: 'string', description: 'Address to check balance' })
          .positional('tokenId', { type: 'string', description: 'Token ID (optional)' }),
        (argv) => this.handleBalance(argv.address as string, argv.tokenId as string)
      )
      .command(
        'tx <from> <to> <amount> [tokenId]',
        'Create a transaction',
        (yargs) => yargs
          .positional('from', { type: 'string', description: 'From address' })
          .positional('to', { type: 'string', description: 'To address' })
          .positional('amount', { type: 'number', description: 'Amount' })
          .positional('tokenId', { type: 'string', description: 'Token ID' }),
        (argv) => this.handleTransaction(
          argv.from as string,
          argv.to as string,
          argv.amount as number,
          argv.tokenId as string
        )
      )
      .command(
        'mine <miner>',
        'Mine pending transactions',
        (yargs) => yargs
          .positional('miner', { type: 'string', description: 'Miner address' }),
        (argv) => this.handleMine(argv.miner as string)
      )
      .command(
        'mint <address> <amount> [tokenId]',
        'Mint tokens',
        (yargs) => yargs
          .positional('address', { type: 'string', description: 'Address to mint to' })
          .positional('amount', { type: 'number', description: 'Amount to mint' })
          .positional('tokenId', { type: 'string', description: 'Token ID (default: MY_TOKEN)' }),
        (argv) =>
          this.handleMint(
            argv.address as string,
            argv.amount as number,
            argv.tokenId as string
          )
      )
      .command(
        'burn <address> <amount> [tokenId]',
        'Burn tokens',
        (yargs) => yargs
          .positional('address', { type: 'string', description: 'Address to burn from' })
          .positional('amount', { type: 'number', description: 'Amount to burn' })
          .positional('tokenId', { type: 'string', description: 'Token ID' }),
        (argv) =>
          this.handleBurn(
            argv.address as string,
            argv.amount as number,
            argv.tokenId as string
          )
      )
      .command(
        'keygen',
        'Generate a new key pair and address',
        {},
        () => this.handleKeygen()
      )
      .command(
        'sign <message> <privateKey>',
        'Sign a message',
        {},
        (argv) => this.handleSign(argv.message as string, argv.privateKey as string)
      )
      .command(
        'verify <message> <signature> <publicKey>',
        'Verify a signature',
        {},
        (argv) =>
          this.handleVerify(
            argv.message as string,
            argv.signature as string,
            argv.publicKey as string
          )
      )
      .command(
        'deploy <creator> [code]',
        'Deploy a smart contract',
        (yargs) => yargs
          .positional('creator', { type: 'string', description: 'Creator address' })
          .positional('code', { type: 'string', description: 'Contract code' }),
        (argv) => this.handleDeployContract(argv.creator as string, argv.code as string)
      )
      .command(
        'reset',
        'Reset the blockchain',
        {},
        () => this.handleReset()
      )
      .help()
      .alias('help', 'h')
      .version('1.0.0')
      .alias('version', 'v')
      .demandCommand(1, 'Please provide a command')
      .strict()
      .showHelpOnFail(true).argv;
  }

  /**
   * Handle 'info' command
   */
  private handleInfo(): void {
    const stats = this.blockchain.getStats();
    console.log(chalk.bold.cyan('\n====== BLOCKCHAIN INFO ======'));
    console.log(chalk.green('Chain Height:'), stats.height);
    console.log(chalk.green('Total Transactions:'), stats.totalTransactions);
    console.log(chalk.green('Pending Transactions:'), stats.pendingTransactions);
    console.log(chalk.green('Current Difficulty:'), stats.difficulty);
    console.log(chalk.green('Total Addresses:'), stats.totalAddresses);
    console.log(chalk.green('Chain Valid:'), stats.isValid ? chalk.green('YES') : chalk.red('NO'));
    console.log();
  }

  /**
   * Handle 'chain' command
   */
  private handleChain(limit: number): void {
    const chain = this.blockchain.getChain().slice(-limit);
    console.log(chalk.bold.cyan('\n====== BLOCKCHAIN ======'));

    const tableData = [['Height', 'Hash', 'Previous Hash', 'Txs', 'Miner']];
    for (const block of chain) {
      tableData.push([
        block.index.toString(),
        block.hash.substring(0, 8) + '...',
        block.previousHash.substring(0, 8) + '...',
        block.transactions.length.toString(),
        block.miner.substring(0, 8) + '...',
      ]);
    }

    console.log(table.table(tableData));
    console.log();
  }

  /**
   * Handle 'balance' command
   */
  private handleBalance(address: string, tokenId?: string): void {
    console.log(chalk.bold.cyan('\n====== BALANCE ======'));
    if (tokenId) {
      const balance = this.blockchain.getBalance(address, tokenId);
      console.log(chalk.green('Address:'), address);
      console.log(chalk.green('Token:'), tokenId);
      console.log(chalk.green('Balance:'), balance);
    } else {
      const balances = this.blockchain.getAllBalances(address);
      console.log(chalk.green('Address:'), address);
      console.log(chalk.green('Balances:'));
      for (const [token, amount] of Object.entries(balances)) {
        console.log(`  ${token}: ${amount}`);
      }
    }
    console.log();
  }

  /**
   * Handle 'tx' command
   */
  private handleTransaction(
    from: string,
    to: string,
    amount: number,
    tokenId?: string
  ): void {
    const tx: Transaction = {
      id: Crypto.randomId(),
      fromAddress: from,
      toAddress: to,
      amount,
      tokenId: tokenId || 'NATIVE_TOKEN',
      timestamp: Date.now(),
    };

    if (this.blockchain.addTransaction(tx)) {
      console.log(chalk.green('\n✓ Transaction added to pool:'));
      console.log(chalk.yellow('ID:'), tx.id);
      console.log(chalk.yellow('From:'), from);
      console.log(chalk.yellow('To:'), to);
      console.log(chalk.yellow('Amount:'), amount);
      console.log(chalk.yellow('Token:'), tokenId || 'NATIVE_TOKEN');
      console.log();
    } else {
      console.log(chalk.red('\n✗ Transaction failed validation'));
      console.log();
    }
  }

  /**
   * Handle 'mine' command
   */
  private handleMine(miner: string): void {
    console.log(chalk.bold.cyan('\nMining...'));
    try {
      const block = this.blockchain.minePendingTransactions(miner);
      console.log(chalk.green('\n✓ Block mined:'));
      console.log(chalk.yellow('Height:'), block.index);
      console.log(chalk.yellow('Hash:'), block.hash);
      console.log(chalk.yellow('Nonce:'), block.nonce);
      console.log(chalk.yellow('Difficulty:'), block.difficulty);
      console.log(chalk.yellow('Transactions:'), block.transactions.length);
      console.log(chalk.yellow('Time:'), new Date(block.timestamp).toISOString());
      console.log();
    } catch (error) {
      console.log(chalk.red('\n✗ Mining failed:'), error instanceof Error ? error.message : 'Unknown error');
      console.log();
    }
  }

  /**
   * Handle 'mint' command
   */
  private handleMint(address: string, amount: number, tokenId?: string): void {
    this.blockchain.mintTokens(address, tokenId || 'NATIVE_TOKEN', amount);
    console.log(chalk.green('\n✓ Tokens minted:'));
    console.log(chalk.yellow('To:'), address);
    console.log(chalk.yellow('Amount:'), amount);
    console.log(chalk.yellow('Token:'), tokenId || 'NATIVE_TOKEN');
    console.log();
  }

  /**
   * Handle 'burn' command
   */
  private handleBurn(address: string, amount: number, tokenId?: string): void {
    const success = this.blockchain.burnTokens(address, tokenId || 'NATIVE_TOKEN', amount);
    if (success) {
      console.log(chalk.green('\n✓ Tokens burned:'));
      console.log(chalk.yellow('From:'), address);
      console.log(chalk.yellow('Amount:'), amount);
      console.log(chalk.yellow('Token:'), tokenId || 'NATIVE_TOKEN');
    } else {
      console.log(chalk.red('\n✗ Burn failed: Insufficient balance'));
    }
    console.log();
  }

  /**
   * Handle 'keygen' command
   */
  private handleKeygen(): void {
    const keyPair = Crypto.generateKeyPair();
    const address = Crypto.publicKeyToAddress(keyPair.publicKey);
    console.log(chalk.bold.cyan('\n====== KEY PAIR ======'));
    console.log(chalk.green('Address:'), address);
    console.log(chalk.green('\nPublic Key:'));
    console.log(keyPair.publicKey);
    console.log(chalk.green('\nPrivate Key:'));
    console.log(chalk.red(keyPair.privateKey));
    console.log(chalk.red('\n⚠ KEEP YOUR PRIVATE KEY SAFE!'));
    console.log();
  }

  /**
   * Handle 'sign' command
   */
  private handleSign(message: string, privateKey: string): void {
    try {
      const signature = Crypto.sign(message, privateKey);
      console.log(chalk.green('\n✓ Message signed:'));
      console.log(chalk.yellow('Signature:'), signature);
      console.log();
    } catch (error) {
      console.log(chalk.red('\n✗ Sign failed:'), error instanceof Error ? error.message : 'Unknown error');
      console.log();
    }
  }

  /**
   * Handle 'verify' command
   */
  private handleVerify(message: string, signature: string, publicKey: string): void {
    try {
      const isValid = Crypto.verify(message, signature, publicKey);
      if (isValid) {
        console.log(chalk.green('\n✓ Signature is valid'));
      } else {
        console.log(chalk.red('\n✗ Signature is invalid'));
      }
      console.log();
    } catch (error) {
      console.log(chalk.red('\n✗ Verify failed:'), error instanceof Error ? error.message : 'Unknown error');
      console.log();
    }
  }

  /**
   * Handle 'deploy' command
   */
  private handleDeployContract(creator: string, code?: string): void {
    try {
      const contractCode =
        code ||
        SmartContractVM.getTokenContractTemplate();
      const contract = this.contractVM.deployContract(creator, contractCode);
      console.log(chalk.green('\n✓ Contract deployed:'));
      console.log(chalk.yellow('Address:'), contract.address);
      console.log(chalk.yellow('ID:'), contract.id);
      console.log(chalk.yellow('Creator:'), creator);
      console.log();
    } catch (error) {
      console.log(chalk.red('\n✗ Deployment failed:'), error instanceof Error ? error.message : 'Unknown error');
      console.log();
    }
  }

  /**
   * Handle 'reset' command
   */
  private handleReset(): void {
    this.blockchain.reset();
    console.log(chalk.green('\n✓ Blockchain reset'));
    console.log();
  }
}
