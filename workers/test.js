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

var subscription = web3.eth.subscribe('pendingTransactions', function(error, result){
    if (!error)
        console.log(result);
})
    .on("data", function(transaction){
        console.log(transaction);
    });

// unsubscribes the subscription
subscription.unsubscribe(function(error, success){
    if(success)
        console.log('Successfully unsubscribed!');
});