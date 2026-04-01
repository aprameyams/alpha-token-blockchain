import { Blockchain } from '../core/blockchain';
import { SmartContractVM } from '../core/smartContract';
import { BlockchainCLI } from './blockchainCLI';

/**
 * CLI Entry Point
 */
const blockchain = new Blockchain();
const contractVM = new SmartContractVM();
const cli = new BlockchainCLI(blockchain, contractVM);

cli.setup();
