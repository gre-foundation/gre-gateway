var config = require('../../../config');
var fs = require('fs');
var url = require('url');
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

var dir = './tmp';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

function Controller() {
}

Controller.prototype.create = function (req, res) {
    var mobile = req.body.mobile;
    if (!mobile || mobile.trim() === "") {
        res.status(200).json({
            "success": false,
            "message": "mobile is required"
        });
    } else {
        let newAccount = web3.eth.accounts.create();
        var privateKey = newAccount.privateKey;
        let encrypted = web3.eth.accounts.encrypt(privateKey, mobile);

        let toChecksumAddress = web3.utils.toChecksumAddress(encrypted.address);
        console.log(toChecksumAddress);

        var filePath = './tmp/' + toChecksumAddress;
        fs.writeFileSync(filePath, JSON.stringify(encrypted));

        var s3 = new AWS.S3();

        // configuring parameters
        var params = {
            Bucket: 'gre-token',
            Body: fs.createReadStream(filePath),
            Key: toChecksumAddress
        };

        s3.upload(params, function (err, data) {
            //handle error
            if (err) {
                console.log("Error", err);
            }
            try {
                fs.unlinkSync(filePath);
                console.log('successfully deleted ' + filePath);
            } catch (err) {
                if (err) throw err;
            }
            //success
            if (data) {
                res.status(200).json({
                    "success": true,
                    "address": toChecksumAddress,
                    "message": "Success"
                });
            } else {
                res.status(400).json({
                    "success": false,
                    "message": "create error."
                });
            }
        });
    }
};
module.exports = new Controller();