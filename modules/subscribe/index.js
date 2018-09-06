const config = require('./../../config');

const watcher = require('./watcher')


// watcher.watchEtherTransfers()
// console.log('Started watching Ether transfers')

watcher.watchTokenTransfers("RISK");
console.log('Started watching Pluton token transfers\n')
