var config = require('../../config');
var database = require('../../db');
var Web3 = require('web3');
var web3 = new Web3(config.web3Provider);
var ethers = require('ethers');
var Wallet = ethers.Wallet;
var utils = ethers.utils;
var providers = ethers.providers;
var provider = new providers.JsonRpcProvider(config.web3Provider, config.ethersNetwork);
var aes = require('crypto-js/aes');
var CryptoJS = require('crypto-js');
var mongoose = require('mongoose');
var Transaction = require('../../models/transaction');
var BitcoinUtils = require('../../utils/bitcoin');
var bluebird = require('bluebird');
var bitcore = require('bitcore-lib');
var PaymentUtils = require('./../../utils/payment');
var ethTx = require('ethereumjs-tx');
var logger = require('../../api/v1/helpers/logHelper');
var BigNumber = require('bignumber.js');

function Payment() {
}


/*@todo: Maintain nonce counter for each address in db*/
Payment.prototype.ethPayment = function (amount, privateKey, concernedAddress, isConcernedAddressHotWallet, isWithdrawal) {
    return new bluebird.Promise(function (resolve, reject) {
        var wallet = new ethers.Wallet(aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8));
        wallet.provider = provider;
        var transaction = {
            to: concernedAddress
        };
        provider.getBalance(wallet.address)
            .then(function (balance) {
                if (isConcernedAddressHotWallet)
                    transaction.value = balance;
                else
                    transaction.value = utils.parseEther(amount);
                return wallet.estimateGas(transaction)
            })
            .then(function (gasEstimate) {
                logger.info(gasEstimate.toString());
                transaction.gasLimit = gasEstimate;
                if (isConcernedAddressHotWallet)
                    transaction.value = transaction.value - (gasEstimate * 10000000000);
                else
                    transaction.value = utils.bigNumberify(transaction.value).add(utils.bigNumberify(gasEstimate * 10000000000));
                return wallet.sendTransaction(transaction);
            })
            .then(function (transaction) {
                var tx = new Transaction();
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
                if (isWithdrawal) {
                    return provider.waitForTransaction(tx.Hash);
                }
                else {
                    return provider.waitForTransaction(tx.Hash);
                }

            })
            .then(function (transaction) {
                resolve(transaction);
            })
            .catch(function (error) {
                reject(error);
            })
    })

};

Payment.prototype.erc20Payment = function (amount, privateKey, fromAddress, toAddress, isWithdrawal, contractAddress, tokenDecimals, trans) {
    var desrypt = aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8);
    var wallet = new ethers.Wallet(desrypt);
    var fromPrivateKeyBuffer = new Buffer(desrypt.slice(2), 'hex');
    wallet.provider = provider;
    var availableBalance;
    var to = toAddress;
    return new bluebird.Promise(function (resolve, reject) {
        PaymentUtils.getERC20Balance(fromAddress)
            .then(function (balance) {
                if (isWithdrawal) {
                    availableBalance = (new BigNumber(amount).multipliedBy(new BigNumber(10).exponentiatedBy(tokenDecimals)));
                }
                else {
                    availableBalance = (new BigNumber(balance));
                }

                const myContract = new web3.eth.Contract(PaymentUtils.abi);
                myContract.options.address = config.erc20.contractAddress;
                myContract.options.from = "0x01964F5e336735e7cfC8A613b5e3991cc587D834";
                let data2 = myContract.methods.transferFrom(fromAddress, to, availableBalance).encodeABI();

                return new bluebird.Promise(function (resolve2, reject2) {
                    web3.eth.getGasPrice().then(function (gasPrice) {
                        web3.eth.getTransactionCount("0x01964F5e336735e7cfC8A613b5e3991cc587D834", (err, count) => {
                            if (err) return;
                            const txData2 = {
                                chainId: 1,
                                // gasPrice: web3.utils.toHex(42000000000),
                                gasPrice: web3.utils.toHex(gasPrice * 2),
                                gasLimit: web3.utils.toHex(81000),
                                to: config.erc20.contractAddress,
                                from: "0x01964F5e336735e7cfC8A613b5e3991cc587D834",
                                value: 0x0,
                                nonce: web3.utils.toHex(count + trans.id),
                                data: data2
                            };
                            var tx2 = new ethTx(txData2);
                            tx2.sign(fromPrivateKeyBuffer);
                            var serializedTx2 = tx2.serialize().toString("hex");
                            if (!serializedTx2) {
                                throw new Error('tx2.serialize fail.');
                            } else {
                                var tran = web3.eth.sendSignedTransaction('0x' + serializedTx2);

                                tran.on('confirmation', (confirmationNumber, receipt) => {
                                    logger.info('confirmation: ' + confirmationNumber);
                                });

                                tran.on('transactionHash', hash => {
                                    logger.info('hash');
                                    logger.info(hash);
                                    resolve2({
                                        hash: hash
                                    })
                                });

                                tran.on('receipt', receipt => {
                                    logger.info('reciept');
                                    logger.info(receipt);
                                });

                                tran.on('error', function (err) {
                                    reject2(err);
                                });
                            }
                        });
                    });
                });
            })
            .then(function (transaction) {
                return database('localhost', 'main').then(function (db) {
                    return new Promise(function (resolve1, reject1) {
                        db.models.gateway_transaction.getAsync(trans.id)
                            .then(function (tx) {
                                tx.wallet = fromAddress;
                                tx.currency = "ERC20";
                                tx.concerned_address = toAddress;
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
                logger.info(tx);
                if (isWithdrawal) {
                    // return tx.Extra
                    return provider.waitForTransaction(tx.k_hash);
                }
                else {
                    return provider.waitForTransaction(tx.k_hash);
                }
            })
            .then(function (transaction) {
                let transactionReceipt = web3.eth.getTransactionReceipt(transaction.hash);
                transactionReceipt.then(data => {
                    resolve(data);
                });
            })
            .catch(function (error) {
                reject(error);
            })
    })
};

Payment.prototype.btcPayment = function (amount, privateKey, fromAddress, toAddress) {
    var privKey = bitcore.PrivateKey.fromWIF(aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8));
    var sourceAddress;
    if (config.btc.network === "testnet") {
        sourceAddress = privKey.toAddress(bitcore.Networks.testnet);
    }
    else {
        sourceAddress = privKey.toAddress(bitcore.Networks.livenet);
    }
    return new bluebird.Promise(function (resolve, reject) {
        BitcoinUtils.getUtxos(sourceAddress.toString())
            .then(function (utxos) {
                var tx = new bitcore.Transaction().fee(7000);

                tx.from(utxos);
                tx.to(toAddress, amount);
                tx.change(sourceAddress);
                tx.sign(privKey);//aes.decrypt(privateKey, config.secretKey).toString(CryptoJS.enc.Utf8));

                return tx.serialize();
            })
            .then(function (serializedTx) {
                return BitcoinUtils.broadcastTx(serializedTx)
            })
            .then(function (res) {
                var tx = new Transaction();
                tx.Wallet = sourceAddress.toString();
                tx.Currency = "BTC";
                tx.ConcernedAddress = toAddress;
                tx.Amount = amount.toString();
                tx.Merchant = config.merchant.merchantId;
                tx.Hash = res.toString();
                tx.Timestamp = parseInt(Date.now() / 1000);
                tx.Extra = res;
                return tx.save();
            })
            .then(function (tx) {
                resolve(tx.Hash)
            })
            .catch(function (error) {
                reject(error);
            })
    })
};

module.exports = new Payment();