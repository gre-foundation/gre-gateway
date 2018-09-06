const Web3 = require('web3')
const config = require('./../../config');
let rp = require('request-promise');
let bluebird = require('bluebird');
var InfuraIO = require("../payment/infura");

async function getConfirmations(txHash) {
    try {
        // Instantiate web3 with HttpProvider
        const web3 = new Web3(config.INFURA_URL)

        // Get transaction details
        const trx = await web3.eth.getTransaction(txHash)

        // Get current block number
        const currentBlock = await web3.eth.getBlockNumber()

        // When transaction is unconfirmed, its block number is null.
        // In this case we return 0 as number of confirmations
        return trx.blockNumber === null ? 0 : currentBlock - trx.blockNumber
    }
    catch (error) {
        console.log(error)
    }
}

function confirmEtherTransaction(event, confirmations = 5) {
    let txHash = event.transactionHash;
    setTimeout(async () => {
        // Get current number of confirmations and compare it with sought-for value
        const trxConfirmations = await getConfirmations(txHash)
        console.log('Transaction with hash ' + txHash + ' has ' + trxConfirmations + ' confirmation(s)')

        if (trxConfirmations >= confirmations) {
            // Handle confirmation event according to your business logic
            console.log('Transaction with hash ' + txHash + ' has been successfully confirmed');
            console.log(event);
            if (event) {
                console.log(event.returnValues);
            }
            if (event && event.returnValues) {
                console.log(event.returnValues.to);
            }
            if (event && event.returnValues) {
                tokenNotify(event.returnValues.to).then(function (data) {
                    console.log(data);
                });
            }
            return
        }
        // Recursive call
        return confirmEtherTransaction(event, confirmations)
    }, 30 * 1000)
}

var tokenNotify = function (address) {
    return new bluebird.Promise(function (resole, reject) {
        let options = {
            url: `http://api.gref.io/api/withdraw/update-wallet?address=${address}`,
            method: "GET",
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

module.exports = confirmEtherTransaction