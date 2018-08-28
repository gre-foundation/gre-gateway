var rp = require('request-promise');
var bluebird = require('bluebird');
var BigNumber = require('bignumber.js');
var config = require('../config');
var Web3 = require('web3');
var web3 = new Web3(config.web3Provider);

module.exports = new bluebird.Promise(function (resole, reject) {
    var options = {
        url: "https://ethgasstation.info/json/ethgasAPI.json",
        method: "GET",
        json: true,
    };
    rp(options)
        .then(function (body) {
            if ((new BigNumber(body.fast)).isNaN()) {
                return web3.eth.getGasPrice().then(function (gasPrice) {
                    resole(web3.utils.toHex(gasPrice * 3));
                })
            } else {
                let val = web3.utils.toWei((new BigNumber(body.fast)).multipliedBy(3).toString(), 'gwei');
                console.log(val);
                resole(web3.utils.numberToHex(val));
            }
        })
        .catch(function (error) {
            return web3.eth.getGasPrice().then(function (gasPrice) {
                resole(web3.utils.toHex(gasPrice * 3));
            })
        });
});
