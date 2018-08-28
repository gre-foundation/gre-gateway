var config = require('./../../../config');
var PaymentUtils = require('./../../../utils/payment');
var Payment = require('./../../../modules/payment/payment');
var web3 = require('web3');
var ethers = require('ethers');
var utils = ethers.utils;
var Erc20Withdrawal = require('./../../../models/erc20Withdrawal');
var EthWithdrawal = require('./../../../models/ethWithdrawal');
var BigNumber = require('bignumber.js');

function Controller() {
}

Controller.prototype.btcBalance = function (req, res) {
    var address = req.params.address.toString();
    PaymentUtils.getBTCBalance(address)
        .then(function (response) {
            res.status(200).json({
                "success": true,
                "address": address,
                "balance": response['balance'].toString(),
                "balanceSat": response['balanceSat'].toString()
            });
        })
        .catch(function (error) {
            res.status(400).json({
                "success": false,
                "message": error
            });
        })
};

Controller.prototype.ethBalance = function (req, res) {
    var address = req.params.address.toString();
    if (web3.utils.isAddress(address)) {
        PaymentUtils.getEtherBalance(address)
            .then(function (balance) {
                res.status(200).json({
                    "success": true,
                    "address": address,
                    "balance": utils.formatEther(balance)
                });
            })
    }
    else {
        res.status(400).json({
            "success": false,
            "message": "invalid ethereum address"
        });
    }
};

Controller.prototype.erc20Balance = function (req, res) {
    var address = req.query.address;
    var type = req.query.type ? req.query.type : "RISK";
    console.log(req.query);
    if (web3.utils.isAddress(address)) {
        try {
            PaymentUtils.getERC20Balance(address, type)
                .then(function (balance) {
                    res.status(200).json({
                        "success": true,
                        "address": address,
                        "balance": parseFloat(balance) / Math.pow(10, config.erc20.decimal)
                    });
                })
                .catch(function (err) {
                    res.status(400).json({
                        "success": false,
                        "message": err,
                    });
                })
        } catch (e) {
            res.status(400).json({
                "success": false,
                "message": e.message
            });
        }
    } else {
        res.status(400).json({
            "success": false,
            "message": "invalid erc20 address"
        });
    }

}
;

Controller.prototype.btcWithdraw = function (req, res) {
    var amount = req.body.amount;
    var withdrawalAddress = req.body.withdrawalAddress;
    if (parseFloat(amount) <= 0 || isNaN(amount)) {
        res.status(400).json({
            "success": false,
            "message": "valid amount is required"
        });
    }
    Payment.btcPayment(parseInt(amount), config.btcHotWalletKey, config.btcHotWalletAddress, withdrawalAddress, true)
        .then(function (tx) {
            res.status(200).json({
                "success": true,
                "tx": tx
            });
        })
};

Controller.prototype.ethWithdraw = function (req, res) {
    var amount = req.body.amount;
    var withdrawalAddress = req.body.withdrawalAddress;
    if ((new BigNumber(amount)).isNaN() || !(new BigNumber(amount)).isGreaterThan(0)) {
        res.status(400).json({
            "success": false,
            "message": "valid amount is required"
        });
    }
    if (web3.utils.isAddress(withdrawalAddress)) {
        req.models.eth_withdrawal.create({
            amount: amount,
            withdrawal_address: withdrawalAddress,
            timestamp: parseInt(Date.now() / 1000)
        }, function (err, item) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.status(200).json({
                    "success": true,
                    "request_id": item.id,
                    "withdrawal_address": item.withdrawal_address,
                    "amount": item.amount
                });
            }
        });
    } else {
        res.status(400).json({
            "success": false,
            "message": "invalid withdrawal address"
        });
    }
};

Controller.prototype.erc20Withdraw = function (req, res) {
    var amount = req.body.amount;
    var tokenType = req.body.tokenType;
    var withdrawalAddress = req.body.withdrawalAddress;
    if ((new BigNumber(amount)).isNaN() || !(new BigNumber(amount)).isGreaterThan(0)) {
        res.status(400).json({
            "success": false,
            "message": "valid amount is required"
        });
    }
    if(!tokenType) {
        res.status(400).json({
            "success": false,
            "message": "valid tokenType is required"
        });
    }
    if (web3.utils.isAddress(withdrawalAddress)) {
        req.models.erc20_withdrawal.create({
            amount: amount,
            token_type: tokenType,
            withdrawal_address: withdrawalAddress,
            k_timestamp: parseInt(Date.now() / 1000),
            status: 1,
        }, function (err, item) {
            if (err) {
                res.status(400).json(err);
            } else {
                res.status(200).json({
                    "success": true,
                    "request_id": item.id,
                    "withdrawal_address": item.withdrawal_address,
                    "amount": item.amount
                });
            }
        });
    } else {
        res.status(400).json({
            "success": false,
            "message": "invalid withdrawal address"
        });
    }
};

module.exports = new Controller();