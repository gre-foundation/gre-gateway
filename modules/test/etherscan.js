var Etherscan = require("../payment/etherscan");
var s3Helper = require('../../api/v1/helpers/s3Helper');

// InfuraIO.eth_gasPrice().then(function (data) {
//     console.log(data);
// });
// InfuraIO.eth_getTransactionCount("0x857FB63d11Ea0400B69D706dAF4968d696E02b1b").then(function (data) {
//     console.log(data);
// });
// InfuraIO.eth_getBalance("0x857FB63d11Ea0400B69D706dAF4968d696E02b1b").then(function (data) {
//     console.log(data);
// });


s3Helper.getWalletKeys().then(withdrawalKeys => {
    Etherscan.eth_sendRawTransaction(1, 0.1, "HT", withdrawalKeys.erc20, "0x857FB63d11Ea0400B69D706dAF4968d696E02b1b", "0xeD40c55baaA747b6B62886a05B81b8a6A8745E41", 18, {id: 1})
        .then(function (data) {
            console.log(data)
        })
        .catch(function (err) {
            console.log(err);
        })
});
