module.exports = {
    apps: [
        {
            name: "Main",
            script: "/data/website/payment-gateway/current/server.js",
            watch: false,
            instances: 1
        },
        // {
        //     name: "ETH Transaction Worker",
        //     script: "./workers/ethTransactionWorker.js",
        //     watch: false
        // },
        // {
        //     name: "ETH Confirmation Worker",
        //     script: "./workers/ethConfirmationWorker.js",
        //     watch: false
        // },
        // {
        //     name: "BTC Transaction Worker",
        //     script: "./workers/btcTxWorkerAddressWise.js",
        //     watch: false
        // },
        // {
        //     name: "BTC Confirmation Worker",
        //     script: "./workers/btcConfirmationWorker.js",
        //     watch: false
        // },
        {
            name: "ERC20 Withdrawal Worker",
            script: "/data/website/payment-gateway/current/workers/erc20WithdrawalWorker.js",
            watch: false
        }
        // ,
        // {
        //     name: "ETH Withdrawal Worker",
        //     script: "./workers/ethWithdrawalWorker.js",
        //     watch: false
        // }
    ]
};
