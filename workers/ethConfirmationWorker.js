var Web3 = require('web3');
var cron = require('node-cron');
var config = require('../config');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var bluebird = require('bluebird');
var web3 = new Web3(config.web3Provider);
var rp = require('request-promise');
var Invoice = require('../models/invoice');
var payment = require('../modules/payment/payment');
var PaymentUtils = require('../utils/payment');
var database = require('../db');


/*@Purpose:
*
*
*
* */

var hitWebHook = function (invoice) {
    return new bluebird.Promise(function (resolve, reject) {
        if (invoice.notify_url) {
            reqBody = {
                "amount": invoice.amount_received,
                "status": invoice.status,
                "paymentId": invoice.id
            };
            options = {
                url: invoice.notify_url,
                method: "POST",
                json: true,
                body: reqBody
            };
            rp(options)
                .then(function (body) {
                    console.log(body);
                    resolve(true)
                })
                .catch(function (error) {
                    resolve(false);
                })
        } else {
            reject(new Error('notify_url no define'));
        }
    })
};

var updateWebhookHitStatus = function (invoice, status) {
    return new bluebird.Promise(function (resolve, reject) {
        database('localhost', 'main').then(function (db) {
            db.models.gateway_invoice.getAsync(invoice.id)
                .then(function (row) {
                    row.notify_url_hit_success = status;
                    row.save(function (error) {
                        if (err) {
                            reject(err)
                        } else {
                            console.log(row.id + " updated to " + status);
                            resolve(true)
                        }
                    })
                })
        });
    })
};

var updateInvoiceStatusAndTx = function (invoice, status) {
    return new bluebird.Promise(function (resolve, reject) {
        database('localhost', 'main').then(function (db) {
            db.models.gateway_invoice.getAsync(invoice.id)
                .then(function (row) {
                    row.status = status;
                    row.save(function (error) {
                        if (err) {
                            reject(err)
                        } else {
                            console.log(row.id + " updated to " + status);
                            resolve(true)
                        }
                    })
                })
        });
    })
};

var processBlock = function (blockNumber) {
    database('localhost', 'main').then(function (db) {
        db.models.gateway_invoice.findAsync({
            currency: ['ETH', 'ERC20'],
            notify_url_hit_success: false
        })
            .each(function (invoices) {
                // console.log(invoices);
                invoices.forEach(function (invoice) {
                    if (invoice.currency === "ETH") {
                        if (parseFloat(invoice.amount_received) >= parseFloat(invoice.amount) && (blockNumber - invoice.block_included) > invoice.block_confirmation) {
                            //set status to paid and hit webhook
                            updateInvoiceStatusAndTx(invoice, "paid")
                                .then(function (success) {
                                    console.log("transferring amount to cold wallet");
                                    return true
                                    // return hitWebHook(invoice)
                                })
                                .then(function (txHash) {

                                    console.log(txHash);
                                    return hitWebHook(invoice)
                                })
                                .then(function (webhookSuccess) {
                                    if (webhookSuccess) {
                                        // transfer amount to cold wallet
                                        updateWebhookHitStatus(invoice, true);
                                        // console.log("transferring amount to cold wallet");
                                        // payment.ethPayment(invoice.Amount, invoice.Wallet.PrivateKey, config.ethColdWalletAddress, true, false);
                                    }
                                })
                                .catch(function (error) {
                                    console.log(error);
                                })
                        }
                    } else {
                        if (parseFloat(invoice.amount_received) >= parseFloat(invoice.amount) && (blockNumber - invoice.block_included) > invoice.block_confirmation) {
                            //set status to paid and hit webhook
                            updateInvoiceStatusAndTx(invoice, "paid")
                                .then(function (success) {
                                    // console.log("transferring amount to cold wallet");
                                    // return payment.erc20Payment(balance, invoice.Wallet.PrivateKey, invoice.Wallet.Address, config.ethColdWalletAddress);
                                    // return hitWebHook(invoice)
                                    return true
                                })
                                .then(function (txHash) {

                                    console.log(txHash);
                                    return hitWebHook(invoice)
                                })
                                .then(function (webhookSuccess) {
                                    if (webhookSuccess) {
                                        // transfer amount to cold wallet
                                        console.log("webhook hit success");
                                        updateWebhookHitStatus(invoice, true);
                                    }
                                })
                                .catch(function (error) {
                                    console.log(error);
                                })
                        }
                    }

                })
            })
    })
};

(function blockConfirmationMonitor() {
    var lastBlock = 0;
    // cron.schedule('*/5 * * * * *', function(){
    web3.eth.getBlockNumber()
        .then(function (currentBlockNumber) {
            console.log("last block : " + lastBlock.toString());
            console.log("current block : " + currentBlockNumber.toString());
            if (lastBlock < currentBlockNumber) {
                lastBlock = currentBlockNumber;
                console.log("processing : " + lastBlock.toString());
                processBlock(currentBlockNumber);
            }
            else {
                console.log(lastBlock.toString() + " already watched")
            }
        })
        .catch(function (error) {
            console.log(error);
        })
    // });
}());