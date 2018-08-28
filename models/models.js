module.exports = function (db, cb) {
    db.define("gateway_blockchain_monitor", {
        id: Number,
        k_key: String,
        k_value: String
    });
    db.define("gateway_erc20_withdrawal", {
        id: Number,
        amount: String,
        k_timestamp: Number,
        status: Number,
        token_type: String,
        withdrawal_address: String,
        withdrawal_success: Boolean,
        withdrawal_confirmation: Boolean,
        extra: Object
    });
    db.define("gateway_eth_withdrawal", {
        id: Number,
        amount: String,
        k_timestamp: Number,
        withdrawal_address: String,
        withdrawal_success: Boolean,
        withdrawal_confirmation: Boolean,
        extra: Object
    });
    db.define("gateway_invoice", {
        id: Number,
        merchant_id: String,
        currency: String,
        amount: String,
        amount_received: String,
        fee: String,
        k_timestamp: Number,
        wallet: Object,
        block_confirmation: Number,
        block_included: Number,
        notify_url: String,
        notify_url_hit_success: Boolean,
        k_status: String,
        cold_wallet_transfer_status: String,
        invoice_extra: Object
    });
    db.define("gateway_transaction", {
        id: Number,
        wallet: String,
        currency: String,
        token_type: String,
        concerned_address: String,
        amount: String,
        merchant: String,
        k_hash: String,
        k_timestamp: Number,
        withdrawal_id: Number,
        extra: Object
    });
    return cb();
};