/**
 * Main entry point for the blockchain application
 */

import Node from './node/node';

// Create and start the blockchain node
const node = new Node();
node.start();

export default node;
