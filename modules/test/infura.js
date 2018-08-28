var InfuraIO = require("../payment/infura");
var s3Helper = require('../../api/v1/helpers/s3Helper');
let BigNumber = require('bignumber.js');

// InfuraIO.eth_gasPrice().then(function (data) {
//     console.log(data);
// });
// InfuraIO.eth_getTransactionCount("0x857FB63d11Ea0400B69D706dAF4968d696E02b1b").then(function (data) {
//     console.log(data);
// });
// InfuraIO.eth_getBalance("0x857FB63d11Ea0400B69D706dAF4968d696E02b1b").then(function (data) {
//     console.log(data);
// });

//
// s3Helper.getWalletKeys().then(withdrawalKeys => {
//     InfuraIO.eth_sendRawTransaction(1, 0.1, "RISK", withdrawalKeys.erc20, "0x857FB63d11Ea0400B69D706dAF4968d696E02b1b", "0xeD40c55baaA747b6B62886a05B81b8a6A8745E41", 18, {id: 1})
//         .then(function (data) {
//             console.log(data)
//         })
//         .catch(function (err) {
//             console.log(err);
//         })
// });
//
//

var availableBalance = parseInt(new BigNumber("10000.000000000000000000").multipliedBy(new BigNumber(10).exponentiatedBy(18)).toString());
console.log(availableBalance);
console.log(new BigNumber("10000.000000000000000000").multipliedBy(new BigNumber(10).exponentiatedBy(18)).toString());
console.log(new BigNumber("10000.000000000000000000").toString());
console.log(new BigNumber(10).exponentiatedBy(18).toString());
// InfuraIO.eth_getTransactionByHash("0x95c15008ee2a42afb266a9a44e407b7aacd3aa00ab8bd77b9c329d84c085e7ff").then(function (data) {
//     if(data && data.result &&  data.result.blockNumber) {
//
//     }
// })
//
// s3Helper.getWalletKeys().then(withdrawalKeys => {
//     InfuraIO.ethPayment(1, "0.01", withdrawalKeys.erc20, "0x857FB63d11Ea0400B69D706dAF4968d696E02b1b", "0xeD40c55baaA747b6B62886a05B81b8a6A8745E41", {id: 1})
//         .then(function (data) {
//             console.log(data)
//         })
//         .catch(function (err) {
//             console.log([
//                 'error', err
//             ]);
//         })
// });


