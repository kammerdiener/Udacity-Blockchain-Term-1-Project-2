// Dependencies
const { Blockchain, Block } = require('./simpleChain');

// Initialization
let blockchain = new Blockchain();

setTimeout(() => {
  for(let i = 0; i < 10; i++) {
    let newBlock = new Block('Lorem ipsum ' + i);
    blockchain.addBlock(newBlock)
      .then((block) => {
        console.log(block);
      })
  }
}, 10);

setTimeout(() => blockchain.validateChain(), 2000);