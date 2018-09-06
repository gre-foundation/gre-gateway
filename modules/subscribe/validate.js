const Decimal = require('decimal.js')
const WEI = 1000000000000000000
const config = require('./../../config');

const ethToWei = (amount) => new Decimal(amount).times(WEI)


function validateTransaction(trx) {
  const toValid = trx.to !== null
  if (!toValid) return false
  
  const walletToValid = trx.to.toLowerCase() === config.WALLET_TO.toLowerCase()
  const walletFromValid = trx.from.toLowerCase() === config.WALLET_FROM.toLowerCase()
  const amountValid = ethToWei(config.AMOUNT).equals(trx.value)


  return toValid && walletToValid && walletFromValid && amountValid
}

module.exports = validateTransaction