var config = require('../../../config');
var fs = require('fs');
var Web3 = require('web3');
var web3 = new Web3(config.web3Provider);
var AWS = require('aws-sdk');
var uuid = require('uuid');
var aes = require('crypto-js/aes');

//configuring the AWS environment
AWS.config.update({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
});


function Helper() {
}

Helper.prototype.getWalletKey = function () {
    return new Promise(function (resolve, reject) {
        let promise = Promise.resolve();

        var s3 = new AWS.S3();
        var options = {
            Bucket: 'gre-token',
            Key: "withdraw_account.pkf",
        };
        var fileStream = s3.getObject(options, function (err, data) {
            // Handle any error and exit
            if (err)
                return err;

            // No error happened
            // Convert Body from a Buffer to a String

            let objectData = data.Body.toString('utf-8'); // Use the encoding necessary

            let encrypted = web3.eth.accounts.decrypt(JSON.parse(objectData), config.secretKey);
            let toString = aes.encrypt(encrypted.privateKey, config.secretKey).toString();
            resolve(toString);
        });
    });
};

module.exports = new Helper();
