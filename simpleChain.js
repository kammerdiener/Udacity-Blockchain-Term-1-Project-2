/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ===== Level Helpers ==============================
|  Pulling in Helpers for level DB        			   |
|  Copied from levelSandbox               			   |
|  ===============================================*/
const level = require('level');
const chainDB = './chaindata';
const db = level(chainDB);

// Add data to levelDB with key/value pair
async function addLevelDBData(key,value){
  return new Promise((resolve, reject) => {
    db.put(key, value)
      .then(() => {
        db.get(key)
          .then((block) => {
            resolve(block)
          })
          .catch((err) => {
            reject(err)
          })
      })
      .catch((err) => {
        reject(err)
      })
  });
}

// Get data from levelDB with key
function getBlock(key){
  return new Promise((resolve, reject) => {
    console.log(key);
    db.get(key)
      .then((block) => {
        resolve(block);
      })
      .catch((err) => {
        reject(err);
      })
  });
}

function getBlockHeight() {
  return new Promise((resolve, reject) => {
    let height = -1;

    db.createReadStream().on('data', (data) => {
      height++
    }).on('error', (error) => {
      reject(error)
    }).on('close', () => {
      resolve(height)
    })
  });
}

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
  constructor(data){
    this.hash = "",
      this.height = 0,
      this.body = data,
      this.time = 0,
      this.previousBlockHash = ""
  }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    getBlockHeight()
      .then((height) => {
        if (height === -1) {
          let genesisBlock = new Block("Genesis Block");
          this.addBlock(genesisBlock)
            .then((block) => {
              console.log("-------- THE GENESIS BLOCK --------");
              console.log(block);
            })
            .catch((err) => {
              console.log(err);
            })
        }
      })
  }

  // Helpers

  // Add new block
  async addBlock(newBlock) {
    const height = parseInt(await getBlockHeight());

    newBlock.height = height + 1;
    newBlock.time = new Date().getTime().toString().slice(0, -3);

    if (newBlock.height > 0) {
      let prevBlock = await getBlock(height);
      prevBlock = JSON.parse(prevBlock);
      newBlock.previousBlockHash = prevBlock.hash;
    }

    newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

    console.log(newBlock);

    return await addLevelDBData(newBlock.height, JSON.stringify(newBlock))
  }

  // validate block
  async validateBlock(blockHeight) {
    let block = await getBlock(blockHeight);
    block = JSON.parse(block);
    let blockHash = block.hash;
    block.hash = '';

    let validBlockHash = SHA256(JSON.stringify(block)).toString();

    if (blockHash === validBlockHash) {
      return true;
    } else {
      console.log('Block # ' + blockHeight + ' invalid hash:');
      return false;
    }
  }

  // Validate blockchain
  async validateChain() {
    let previousHash = '';
    let hasError = false;

    const height = await getBlockHeight();

    for (let i = 0; i <= height; i++) {
      getBlock(i)
        .then(async (block) => {
          block = JSON.parse(block);
          const isValidBlock = await this.validateBlock(block.height);

          if (!isValidBlock) {
            console.log("error on block: " + i);
            hasError = true;
          }

          if (block.previousBlockHash !== previousHash) {
            console.log("error previous block hash on block: " + i);
            hasError = true;
          }

          previousHash = block.hash;

          if (!hasError) {
            console.log("BLOCKCHAIN VALIDATED")
          }
        })
    }
  }
}

module.exports = { Blockchain, Block };