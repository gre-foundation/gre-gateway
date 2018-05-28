var BigNumber = require('bignumber.js');


var availableBalance = (new BigNumber("500.0001").multipliedBy(new BigNumber(10).exponentiatedBy(18)));

console.log(new BigNumber(10).exponentiatedBy(18).toString());
console.log(availableBalance.toString());