var config = require('./../../../config');
var PaymentUtils = require('./../../../utils/payment');
var Payment = require('./../../../modules/payment/payment');
var web3 = require('web3');
var ethers = require('ethers');
var utils = ethers.utils;
var Erc20Withdrawal = require('./../../../models/erc20Withdrawal');
var EthWithdrawal = require('./../../../models/ethWithdrawal');
var BigNumber = require('bignumber.js');
var InfuraIO = require("../../../modules/payment/infura");

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
        InfuraIO.eth_getBalance(address)
            .then(function (balance) {
                res.status(200).json({
                    "success": true,
                    "address": address,
                    "balance": balance
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
    if (web3.utils.isAddress(address)) {
        try {
            InfuraIO.eth_getContractBalance(address, config.constractAddresses[type])
                .then(function (balance) {
                    res.status(200).json({
                        "success": true,
                        "address": address,
                        "balance": balance
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
module.exports = new Controller();