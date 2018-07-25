var Web3 = require('web3');
var cron = require('node-cron');
var config = require('../config');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var bluebird = require('bluebird');
var web3 = new Web3(config.web3Provider);
var rp = require('request-promise');
var Erc20Withdrawal = require('../models/erc20Withdrawal');
var Payment = require('../modules/payment/payment');
var PaymentUtils = require('../utils/payment');
var s3Helper = require('../api/v1/helpers/s3Helper');
var logger = require('../api/v1/helpers/logHelper');
var orm = require('orm');
var database = require('../db');

var updateWithdrawalStatus = function (item, tx) {
    // tx = JSON.parse('{"hash":"0xa3be7d8795281682ed7ebdc674bb08745507c42c8d85428915876e80cc0c8272","blockHash":"0xe1de7de848bbd6908f82bf30ba9bdad6a57f086e0dc43fc221341f76b1e908d5","blockNumber":5655363,"transactionIndex":39,"from":"0x01964F5e336735e7cfC8A613b5e3991cc587D834","gasPrice":{"_bn":"2540be400"},"gasLimit":{"_bn":"13c68"},"to":"0x4b04633ee658d83a24a91E3a1b244221800D89B4","value":{"_bn":"0"},"nonce":22,"data":"0x23b872dd000000000000000000000000afd131ab3d89ce17b1ec5236421f0c145c030192000000000000000000000000ed40c55baaa747b6b62886a05b81b8a6a8745e410000000000000000000000000000000000000000000000056bc75e2d63100000","r":"0x5b5a3490d959cba2e60fc718fa9702e240c8dffc5ebd3fe48b3b18ebef0d1e50","s":"0x4f36f89bffdbe97c2dbc6d4eba383e659c536d63a9ecaab3fc1eea6456fb9d97","v":38,"creates":null,"raw":"0xf8ca168502540be40083013c68944b04633ee658d83a24a91e3a1b244221800d89b480b86423b872dd000000000000000000000000afd131ab3d89ce17b1ec5236421f0c145c030192000000000000000000000000ed40c55baaa747b6b62886a05b81b8a6a8745e410000000000000000000000000000000000000000000000056bc75e2d6310000026a05b5a3490d959cba2e60fc718fa9702e240c8dffc5ebd3fe48b3b18ebef0d1e50a04f36f89bffdbe97c2dbc6d4eba383e659c536d63a9ecaab3fc1eea6456fb9d97","networkId":1}');
    return new bluebird.Promise(function (resolve, reject) {
        database('localhost', 'main').then(function (db) {
            db.models.gateway_erc20_withdrawal.getAsync(item.id)
                .then(function (row) {
                    if (tx.status !== undefined) {
                        if(tx.status) {
                            row.withdrawal_success = true;
                            row.status = 1;
                            row.extra = tx;
                            row.save(function (error) {
                                logger.info("updateWithdrawalStatus success.");
                                if (error) {
                                    reject(error)
                                } else {
                                    resolve(item)
                                }
                            })
                        } else {
                            row.extra = tx;
                            row.save(function (error) {
                                logger.info("updateWithdrawalStatus error.");
                                logger.info(tx);
                                if (error) {
                                    reject(error)
                                } else {
                                    resolve(item)
                                }
                            })
                        }
                    } else {
                        row.extra = tx;
                        row.save(function (error) {
                            logger.info("updateWithdrawalStatus error.");
                            logger.info(tx);
                            if (error) {
                                reject(error)
                            } else {
                                resolve(item)
                            }
                        })
                    }
                });
        })
    })
};

var processWithdrawal = function (trans, request, withdrawalKey) {
    database('localhost', 'main').then(function (db) {
        db.models.gateway_erc20_withdrawal.getAsync(request.id)
            .then(function (row) {
                row.status = 200;
                row.save(function (err) {
                    if (err) {
                        logger.error(err);
                    } else {
                        Payment.erc20Payment(row.amount, withdrawalKey, config.erc20WithdrawalWallet, row.withdrawal_address, true, config.erc20.contractAddress, 18, trans)
                            .then(function (transaction) {
                                updateWithdrawalStatus(row, transaction)
                                    .then(function (res) {
                                        logger.info('update ' + row.id + 'success');
                                    })
                            })
                            .catch(function (error) {
                                logger.error(error);
                                try {
                                    response = error.responseText ? JSON.parse(error.responseText) : null;
                                }
                                catch (e) {
                                    response = null;
                                }
                                if (response) {
                                    logger.info(response);
                                    if (response.error && response.error.code === -32000) {
                                        row.status = 1;
                                        row.save(function () {
                                            logger.info("rollback " + row.id + " success.")
                                        })
                                    }
                                }
                            })
                    }
                });
            })
    })
};

(function erc20Withdrawal() {
    s3Helper.getWalletKey().then(withdrawalKey => {
        database('localhost', 'main').then(function (db) {
            // cron.schedule('*/1 * * * *', function () {
                db.models.gateway_erc20_withdrawal.findAsync({
                    withdrawal_success: 0,
                    status: 1,
                }, {limit: 10})
                    .each(function (item) {
                        db.models.gateway_transaction.create({}, function (err, trans) {
                            processWithdrawal(trans, item, withdrawalKey)
                        });
                    });
            // })
        });
    });
}());