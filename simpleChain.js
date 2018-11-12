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
function addLevelDBData(key,value){
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
function getLevelDBData(key){
  return new Promise((resolve, reject) => {
    db.get(key)
      .then((block) => {
        resolve(block);
      })
      .catch((err) => {
        reject(err);
      })
  });
}

// Add data to levelDB with value
function addDataToLevelDB(value) {
  let i = 0;
  db.createReadStream().on('data', function(data) {
    i++;
  }).on('error', function(err) {
    return console.log('Unable to read data stream!', err)
  }).on('close', function() {
    console.log('Block #' + i);
    addLevelDBData(i, value);
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
    this.getBlockHeight()
      .then((height) => {
        if (height === 0) {
          let genesisBlock = new Block("Genesis Block");
          this.addBlock(genesisBlock)
            .then((block) => {
              console.log("-------- THE GENESIS BLOCK --------");
              console.log(block);
              this.setBlockHeight(1);
            })
        }
      })
  }

  // Helpers
  // Get block height
  getBlockHeight(){
    return new Promise((resolve, reject) => {
      getLevelDBData('height')
        .then((height) => {
          if(height === -1){
            resolve(0)
          } else {
            resolve(height)
          }
        })
        .catch((err) => {
          reject(err)
        })
    });
  }

  // Set block height
  setBlockHeight(newHeight) {
    return addLevelDBData('height', newHeight)
      .then((data) => {
        return data;
      })
  }

  // get block
  getBlock(blockHeight){
    return new Promise((resolve, reject) => {
      getLevelDBData(blockHeight)
        .then((block) => {
          resolve(block)
        })
        .catch((err) => {
          reject(err)
        });
    });
  }

  // Add new block
  addBlock(newBlock){
    return new Promise((resolve, reject) => {
      // Block height
      this.getBlockHeight()
        .then((height) => {
          newBlock.height = height
        })
        .catch((err) => {
          reject(err)
        });
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);
      // previous block hash
      if(newBlock.height>0){
        getLevelDBData(newBlock.height - 1)
          .then((previousBlock) => {
            newBlock.previousBlockHash = previousBlock.hash;
          })
          .catch((err) => {
            reject(err)
          })
      }
      // Block hash with SHA256 using newBlock and converting to a string
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

      // Adding to LevelDB
      addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString())
        .then((block) => {
          this.setBlockHeight(parseInt(newBlock.height) + 1)
            .then((height) => {
              resolve(block)
            })
            .catch((err) => {
              reject(err);
            })
        })
    });
  }

  // validate block
  async validateBlock(blockHeight){
    // get block object
    this.getBlock(blockHeight)
      .then((block) => {
        console.log(block);
        block = JSON.parse(block);
        // get block hash
        let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // Compare
        if (blockHash===validBlockHash) {
          return true;
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
          return false;
        }
      });
  }

  // Validate blockchain
  validateChain(){
    let errorLog = [];
    this.getBlockHeight()
      .then((height) => {
        console.log(height);
        for (let i = 0; i < parseInt(height); i++) {
          // validate block
          if (!this.validateBlock(i))errorLog.push(i);
          // compare blocks hash link
          this.getBlock(i)
            .then((currentBlock) => {
              currentBlock = JSON.parse(currentBlock);
              this.getBlock(i+1)
                .then((nextBlock) => {
                  nextBlock = JSON.parse(nextBlock);
                  if(currentBlock.hash !== nextBlock.previousBlockHash) {
                    errorLog.push(i)
                  }
                });
            });
        }
        if (errorLog.length>0) {
          console.log('Block errors = ' + errorLog.length);
          console.log('Blocks: '+errorLog);
        } else {
          console.log('No errors detected');
        }
      })
  }
}

module.exports = { Blockchain, Block };