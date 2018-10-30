// Dependencies
const { Blockchain, Block } = require('./simpleChain');

// Initialization
let blockchain = new Blockchain();

for (let i = 0; i <= 10; i++) {
  blockchain.addBlock(new Block("lorem ipsum dolor: "+i));
}

blockchain.validateChain();