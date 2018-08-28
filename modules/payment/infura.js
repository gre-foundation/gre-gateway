let rp = require('request-promise');
let bluebird = require('bluebird');
let BigNumber = require('bignumber.js');
let PaymentUtils = require('./../../utils/payment');

let config = require('../../config');
let Web3 = require('web3');
let web3 = new Web3(config.web3Provider);
let ethers = require('ethers');
let utils = ethers.utils;
let providers = ethers.providers;
let provider = new providers.JsonRpcProvider(config.web3Provider, config.ethersNetwork);
let ethTx = require('ethereumjs-tx');

let CryptoJS = require('crypto-js');
let aes = require('crypto-js/aes');

let database = require('../../db');

let host = "https://mainnet.infura.io/v3/a2389719d28e4c6797f7b1adc9dde0b2";

// let host = "https://api.myetherapi.com/eth";

function InfuraIO() {
}


InfuraIO.prototype.eth_gasPrice = function () {
    return new bluebird.Promise(function (resole, reject) {
        let options = {
            url: host,
            method: "POST",
            body: {"jsonrpc": "2.0", "id": 1, "method": "eth_gasPrice", "params": []},
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
        };
        rp(options)
            .then(function (body) {
                console.log(body);
                console.log(new BigNumber(web3.utils.toWei('1', 'gwei')).toString());
                let val = (new BigNumber(new web3.utils.BN(body.result).toString())).multipliedBy(2);
                console.log(val.toString());
                resole(web3.utils.toHex(val));
            })
            .catch(function (error) {
                reject(error);
            });
    })
};
InfuraIO.prototype.eth_getBalance = function (address) {
    return new bluebird.Promise(function (resole, reject) {
        let options = {
            url: host,
            method: "POST",
            body: {
                "jsonrpc": "2.0", "id": 1, "method": "eth_getBalance", "params": [
                    address, "latest"
                ]
            },
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
        };
        rp(options)
            .then(function (body) {
                resole(body);
            })
            .catch(function (error) {
                reject(error);
            });
    })
};

InfuraIO.prototype.eth_getTransactionCount = function (address) {
    return new bluebird.Promise(function (resole, reject) {
        let options = {
            url: host,
            method: "POST",
            body: {
                "jsonrpc": "2.0", "id": 1, "method": "eth_getTransactionCount", "params": [
                    address, "latest"
                ]
            },
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
        };
        rp(options)
            .then(function (body) {
                resole((new BigNumber(body.result)).toString());
            })
            .catch(function (error) {
                reject(error);
            });
    })
};

InfuraIO.prototype.eth_sendRawTransaction = function (withdrawal_id, amount, tokenType, privateKey, fromAddress, toAddress, tokenDecimals, trans) {
    let that = this;
    let wallet = new ethers.Wallet(aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8));
    wallet.provider = provider;
    let desrypt = aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8);
    let fromPrivateKeyBuffer = new Buffer(desrypt.slice(2), 'hex');
    let availableBalance;
    return new bluebird.Promise(function (resolve, reject) {
        new bluebird
            .Promise(function (resolve2, reject2) {
                availableBalance = (new BigNumber(amount).multipliedBy(new BigNumber(10).exponentiatedBy(tokenDecimals)));
                return that.eth_gasPrice().then(function (gasPrice) {
                    return that.eth_getTransactionCount(fromAddress).then(function (v) {
                        let count = v;
                        const myContract = new web3.eth.Contract(PaymentUtils.abi);
                        myContract.options.address = config.constractAddresses[tokenType];
                        let rawTransaction = {
                            "from": fromAddress,
                            gasPrice: gasPrice,
                            gasLimit: web3.utils.toHex(81000),
                            "to": config.constractAddresses[tokenType],
                            "value": "0x0",
                            "data": myContract.methods.transfer(toAddress, availableBalance).encodeABI(),
                            "nonce": web3.utils.toHex(count),
                        }
                        //creating tranaction via ethereumjs-tx
                        let transaction = new ethTx(rawTransaction);
                        //signing transaction with private key
                        transaction.sign(fromPrivateKeyBuffer);
                        //sending transacton via web3 module
                        let data = '0x' + transaction.serialize().toString('hex');
                        let options = {
                            url: host,
                            method: "POST",
                            body: {
                                "jsonrpc": "2.0", "id": 1, "method": "eth_sendRawTransaction", "params": [
                                    data
                                ]
                            },
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            json: true,
                        };
                        rp(options)
                            .then(function (body) {
                                console.log(body);
                                if (body.error) {
                                    reject2(body);
                                } else {
                                    resolve2({
                                        hash: body.result
                                    });
                                }
                            })
                            .catch(function (error) {
                                reject2(error);
                            });
                    })
                });
            })
            .then(function (transaction) {
                console.log(transaction);
                return database('localhost', 'main').then(function (db) {
                    return new Promise(function (resolve1, reject1) {
                        db.models.gateway_transaction.getAsync(trans.id)
                            .then(function (tx) {
                                tx.wallet = fromAddress;
                                tx.currency = "ERC20";
                                tx.token_type = tokenType;
                                tx.withdrawal_id = withdrawal_id;
                                tx.concerned_address = toAddress;
                                BigNumber.config({EXPONENTIAL_AT: 5});
                                tx.amount = availableBalance.toString();
                                tx.merchant = config.merchant.merchantId;
                                tx.k_hash = transaction.hash;
                                tx.k_timestamp = parseInt(Date.now() / 1000);
                                tx.extra = transaction;
                                tx.save(function (error) {
                                    if (error) {
                                        reject1(error);
                                    } else {
                                        resolve1(tx);
                                    }
                                })
                            })
                    });
                });
            })
            .then(function (tx) {
                resolve({
                    hash: tx.k_hash
                });
            })
            .catch(function (error) {
                reject(error);
            })
    })
};
InfuraIO.prototype.eth_getTransactionByHash = function (hash, id) {
    return new bluebird.Promise(function (resole, reject) {
        let options = {
            url: host,
            method: "POST",
            body: {"jsonrpc": "2.0", "id": 1, "method": "eth_getTransactionByHash", "params": [hash]},
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
        };
        rp(options)
            .then(function (body) {
                resole({
                    id: id,
                    result: body.result
                });
            })
            .catch(function (error) {
                reject(error);
            });
    })
}


/*@todo: Maintain nonce counter for each address in db*/
InfuraIO.prototype.ethPayment = function (withdrawal_id, amount, privateKey, fromAddress, concernedAddress, trans) {
    let that = this;
    let wallet = new ethers.Wallet(aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8));
    wallet.provider = provider;
    let desrypt = aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8);
    let fromPrivateKeyBuffer = new Buffer(desrypt.slice(2), 'hex');

    return new bluebird.Promise(function (resolve, reject) {
        provider.getBalance(wallet.address)
            .then(function (balance) {
                if (new BigNumber(balance.toString()).isLessThan(utils.parseEther(amount).toString())) {
                    reject("余额不足");
                }
                return that.eth_gasPrice();
            })
            .then(function (gasEstimate) {
                return new bluebird
                    .Promise(function (resolve2, reject2) {
                        return that.eth_getTransactionCount(fromAddress).then(function (count) {
                            let value = (new BigNumber(utils.parseEther(amount).toString())).toString();
                            // let value = (new BigNumber(utils.parseEther(amount).toString())).plus(new BigNumber(gasEstimate).multipliedBy(10000000000)).toString();
                            console.log(value);
                            let rawTransaction = {
                                "from": fromAddress,
                                gasPrice: gasEstimate,
                                gasLimit: web3.utils.toHex(81000),
                                "to": concernedAddress,
                                "value": web3.utils.toHex(value),
                                "data": "0x0",
                                "nonce": web3.utils.toHex(count),
                            };
                            // //creating tranaction via ethereumjs-tx
                            let transaction = new ethTx(rawTransaction);
                            //signing transaction with private key
                            transaction.sign(fromPrivateKeyBuffer);
                            //sending transacton via web3 module
                            let data = '0x' + transaction.serialize().toString('hex');
                            let options = {
                                url: host,
                                method: "POST",
                                body: {
                                    "jsonrpc": "2.0", "id": 1, "method": "eth_sendRawTransaction", "params": [
                                        data
                                    ]
                                },
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                json: true,
                            };
                            rp(options)
                                .then(function (body) {
                                    console.log(body);
                                    if (body.error) {
                                        reject2(body);
                                    } else {
                                        resolve2({
                                            hash: body.result
                                        });
                                    }
                                })
                                .catch(function (error) {
                                    reject2(error);
                                });
                        })
                    });
            })
            .then(function (transaction) {
                console.log(trans);
                return database('localhost', 'main').then(function (db) {
                    return new Promise(function (resolve1, reject1) {
                        db.models.gateway_transaction.getAsync(trans.id)
                            .then(function (tx) {
                                tx.wallet = fromAddress;
                                tx.currency = "ETH";
                                tx.withdrawal_id = withdrawal_id;
                                tx.concerned_address = concernedAddress;
                                BigNumber.config({EXPONENTIAL_AT: 5});
                                tx.amount = utils.parseEther(amount).toString();
                                tx.merchant = config.merchant.merchantId;
                                tx.k_hash = transaction.hash;
                                tx.k_timestamp = parseInt(Date.now() / 1000);
                                tx.extra = transaction;
                                tx.save(function (error) {
                                    if (error) {
                                        reject1(error);
                                    } else {
                                        resolve1(tx);
                                    }
                                })
                            })
                    });
                });
                let tx = new Transaction();
                tx.Wallet = transaction.from;
                tx.Currency = "ETH";
                tx.ConcernedAddress = transaction.to;
                tx.Amount = transaction.value;
                tx.Merchant = config.merchant.merchantId;
                tx.Hash = transaction.hash;
                tx.Timestamp = parseInt(Date.now() / 1000);
                tx.Extra = transaction;
                return tx.save();
            })
            .then(function (tx) {
                resolve({
                    hash: tx.k_hash
                });
            })
            .catch(function (error) {
                reject(error);
            })
    })

};


module.exports = new InfuraIO();
