const Web3 = require('web3')
const validateTransaction = require('./validate');
const confirmEtherTransaction = require('./confirm');
const TOKEN_ABI = require('./abi');
const config = require('./../../config');


function watchEtherTransfers() {
    // Instantiate web3 with WebSocket provider
    const web3 = new Web3(new Web3.providers.WebsocketProvider(config.INFURA_WS_URL));

    // Instantiate subscription object
    const subscription = web3.eth.subscribe('pendingTransactions');

    // Subscribe to pending transactions
    subscription.subscribe((error, result) => {
        if (error) console.log(error);
        console.log(result)
    })
        .on('data', async (txHash) => {
            try {
                console.log(txHash);
                // Instantiate web3 with HttpProvider
                const web3Http = new Web3(config.INFURA_URL);

                // Get transaction details
                const trx = await web3Http.eth.getTransaction(txHash);

                // const valid = validateTransaction(trx);
                // If transaction is not valid, simply return
                // if (!valid) return;

                // console.log('Found incoming Ether transaction from ' + config.WALLET_FROM + ' to ' + config.WALLET_TO);
                console.log('Transaction value is: ' + config.AMOUNT)
                console.log('Transaction hash is: ' + txHash + '\n')

                // Initiate transaction confirmation
                confirmEtherTransaction(txHash);

                // Unsubscribe from pending transactions.
                subscription.unsubscribe()
            }
            catch (error) {
                console.log(error)
            }
        })
}

function watchTokenTransfers(tokenType) {
    // Instantiate web3 with WebSocketProvider
    const web3 = new Web3(new Web3.providers.WebsocketProvider(config.INFURA_WS_URL));

    // Instantiate token contract object with JSON ABI and address
    const tokenContract = new web3.eth.Contract(
        TOKEN_ABI, config.constractAddresses[tokenType],
        (error, result) => {
            if (error) console.log(error)
        }
    )

    // Generate filter options
    const options = {
        // filter: {
        //   // _from:  config.WALLET_FROM,
        //   _to:    config.WALLET_TO,
        //   _value: config.AMOUNT
        // },
        fromBlock: 'latest'
    }

    // Subscribe to Transfer events matching filter criteria
    tokenContract.events.Transfer(options, async (error, event) => {
        if (error) {
            console.log(error)
            return
        }
        console.log(event);
        // Initiate transaction confirmation
        confirmEtherTransaction(event);
        return
    })
}


module.exports = {
    // watchEtherTransfers,
    watchTokenTransfers
}