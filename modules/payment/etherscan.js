var rp = require('request-promise');
var bluebird = require('bluebird');
var BigNumber = require('bignumber.js');
var PaymentUtils = require('./../../utils/payment');

var config = require('../../config');
var Web3 = require('web3');
var web3 = new Web3(config.web3Provider);
var ethers = require('ethers');
var utils = ethers.utils;
var providers = ethers.providers;
var provider = new providers.JsonRpcProvider(config.web3Provider, config.ethersNetwork);
var ethTx = require('ethereumjs-tx');

var CryptoJS = require('crypto-js');
var aes = require('crypto-js/aes');

var database = require('../../db');

let host = "https://mainnet.infura.io/v3/a2389719d28e4c6797f7b1adc9dde0b2";

// let host = "https://api.myetherapi.com/eth";

function Etherscan() {
}

Etherscan.prototype.eth_gasPrice = function () {
    return new bluebird.Promise(function (resole, reject) {
        var options = {
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
Etherscan.prototype.eth_getBalance = function (address) {
    return new bluebird.Promise(function (resole, reject) {
        var options = {
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

Etherscan.prototype.eth_getTransactionCount = function (address) {
    return new bluebird.Promise(function (resole, reject) {
        var options = {
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

Etherscan.prototype.eth_sendRawTransaction = function (withdrawal_id, amount, tokenType, privateKey, fromAddress, toAddress, tokenDecimals, trans) {
    var that = this;
    var wallet = new ethers.Wallet(aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8));
    wallet.provider = provider;
    var desrypt = aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8);
    var fromPrivateKeyBuffer = new Buffer(desrypt.slice(2), 'hex');
    var availableBalance;
    return new bluebird.Promise(function (resolve, reject) {
        new bluebird
            .Promise(function (resolve2, reject2) {
                availableBalance = parseInt(new BigNumber(amount).multipliedBy(new BigNumber(10).exponentiatedBy(tokenDecimals)).toString());
                console.log(availableBalance);
                return that.eth_gasPrice().then(function (gasPrice) {
                    return that.eth_getTransactionCount(fromAddress).then(function (v) {
                        let count = v;
                        const myContract = new web3.eth.Contract(PaymentUtils.abi);
                        myContract.options.address = config.constractAddresses[tokenType];
                        console.log((new BigNumber(gasPrice)).toString());
                        var rawTransaction = {
                            "from": fromAddress,
                            gasPrice: gasPrice,
                            gasLimit: web3.utils.toHex(81000),
                            "to": config.constractAddresses[tokenType],
                            "value": "0x0",
                            "data": myContract.methods.transfer(toAddress, availableBalance).encodeABI(),
                            "nonce": web3.utils.toHex(count),
                        }
                        //creating tranaction via ethereumjs-tx
                        var transaction = new ethTx(rawTransaction);
                        //signing transaction with private key
                        transaction.sign(fromPrivateKeyBuffer);
                        //sending transacton via web3 module
                        let data = '0x' + transaction.serialize().toString('hex');
                        var options = {
                            url: "https://api.etherscan.io/api?module=transaction&action=getstatus&txhash=" + data + "&apikey=63N8N3KZH6SKYU5RHAGV346MIPIFPG4RJX",
                            method: "GET",
                            json: true,
                        };
                        rp(options)
                            .then(function (body) {
                                console.log(body);
                                resolve2({
                                    hash: body.result
                                });
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


module.exports = new Etherscan();
