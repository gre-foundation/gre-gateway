var env = process.env.NODE_ENV || 'development';

var config = {
    'development': {
        'port': process.env.PORT || '3001',
        'db': 'mongodb://test:test123@ds251889.mlab.com:51889/payment-gateway',
        'api': 'v1',
        'secretKey': '18917062780',
        'merchant': {
            'merchantId': '001',
            'email': '001@merchant.com',
            'password': 'merchant123',
            'apiKey': '1234qwertyvdv4t45'
        },
        'aws': {
            accessKeyId: "",
            secretAccessKey: ""
        },
        'mysql': {
            'protocol': 'mysql',
            'host': 'localhost',
            'port': '3306',
            'database': 'site_gre',
            'user': 'site_gre',
            'password': 'site_gre',
            'charset': 'utf8mb4',
            'query': {pool: true}
        },
        'btc': {
            'network': 'testnet', // testnet || livenet
            'testnet': {
                'apiBaseUrl': 'https://test-insight.bitpay.com'
            },
            'livenet': {
                'apiBaseUrl': 'http://insight.coinbank.info/insight-api'
            }
        },
        'erc20': {
            'decimal': 18,
            'contractAddress': '0x4b04633ee658d83a24a91E3a1b244221800D89B4'
        },
        'btcColdWalletAddress': 'mtKABrarRT8f59hz2SLGSiiaXfBWcfrZyu',
        'ethColdWalletAddress': '0xbe76Bc7079B2207932705594bA4F8e5a1BA7545F',
        'btcHotWalletAddress': 'mgXAUZoVfbtscs1oo1bKwxjbXp1LPmvsPs',
        'btcHotWalletKey': 'U2FsdGVkX19dbe7+VWn66JkzfJGwaxUxV7s5slEuUsyEeQMwMJKnSjrOs1nF3kchIwuVnWFxvS4/miBas1SYYIMjh+03a9OuM+A7Jf/24SE=',
        'ethHotWalletAddress': '0x626018D548daA7393b63Fa1001014eFe175a7177',
        'ethHotWalletKey': 'U2FsdGVkX1+XUwwYjzcdXtQtRQCkSQ8DZkCpScgdOk3O1udoWO5etYZHIuXWhrK9EA7VpER7SrmHRVZjV3fgi2++Xtwl56GKXs3OuEIEOM2t7tlaVFHmmhLCj9niRCvH',
        'ethPreviousBlock': 0,
        'erc20WithdrawalKey': '',  // 转存S3
        'erc20WithdrawalWallet': '0xAFD131aB3D89ce17B1EC5236421f0C145C030192',
        'web3Provider': 'http://52.221.98.227:8545',
        'ethersNetwork': require('ethers').providers.networks.ropsten
    },
    'production': {
        'port': process.env.PORT,
        'db': process.env.MONGO_URI,
        'api': 'v1',
        'secretKey': process.env.SECRET_KEY,
        'merchant': {
            'merchantId': process.env.MERCHANT_ID || '001',
            'email': process.env.EMAIL || '001@merchant.com',
            'password': process.env.PASSWORD || 'merchant123',
            'apiKey': process.env.API_KEY || '1234qwertyvdv4t45'
        },
        'aws': {
            accessKeyId: process.env.ACCESS_KEY_ID,
            secretAccessKey: process.env.SECRET_ACCESS_KEY,
        },
        'mysql': {
            'protocol': 'mysql',
            'host': process.env.MYSQL_HOST,
            'port': process.env.MYSQL_PORT,
            'database': process.env.MYSQL_DATABASE,
            'user': process.env.MYSQL_USER,
            'password': process.env.MYSQL_PASS,
            'charset': 'utf8mb4',
            'query': {pool: true}
        },
        'btc': {
            'network': 'livenet', // testnet || livenet
            'testnet': {
                'apiBaseUrl': 'https://test-insight.bitpay.com'
            },
            'livenet': {
                'apiBaseUrl': 'http://insight.coinbank.info/insight-api'
            }
        },
        'erc20': {
            'decimal': 18,
            'contractAddress': '0x4b04633ee658d83a24a91E3a1b244221800D89B4'
        },
        'erc20WithdrawalKey': process.env.ERC20_WITHDRAWAL_KEY || '', // 转存S3
        'erc20WithdrawalWallet': process.env.ERC20_WITHDRAWAL_WALLET || '',
        'btcColdWalletAddress': process.env.BTC_COLD_WALLET_ADDRESS || '',
        'ethColdWalletAddress': process.env.ETH_COLD_WALLET_ADDRESS || '',// required
        'btcHotWalletAddress': process.env.BTC_HOT_WALLET_ADDRESS || '',
        'btcHotWalletKey': process.env.BTC_HOT_WALLET_KEY || '',
        'ethHotWalletAddress': process.env.ETH_HOT_WALLET_ADDRESS || '',// required
        'ethHotWalletKey': process.env.ETH_HOT_WALLET_KEY, // 转存S3
        'web3Provider': 'http://internal-gre-eth-lb-195930554.ap-northeast-2.elb.amazonaws.com:8545',
        'ethersNetwork': require('ethers').providers.networks.homestead
    }
};

let config2 = config[env];

module.exports = config2;
