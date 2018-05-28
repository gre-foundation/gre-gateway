var express = require('express');
var mongoose = require('mongoose');
var http = require('http');
var bodyParser = require('body-parser');
var winston = require('winston');
mongoose.Promise = require('bluebird');
var config = require('./config');
var cors = require('cors');
var app = express();
var orm = require('orm');
var fs = require('fs');
var logger = require('./api/v1/helpers/logHelper');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(orm.express(config.mysql, {
    define: function (db, models, next) {
        db.load(__dirname + "/models/models", function (err) {
            models.blockchain_monitor = db.models.gateway_blockchain_monitor;
            models.erc20_withdrawal = db.models.gateway_erc20_withdrawal;
            models.eth_withdrawal = db.models.gateway_eth_withdrawal;
            models.invoice = db.models.gateway_invoice;
            models.transaction = db.models.gateway_transaction;
            next();
        });

    }
}));
app.use('/' + config.api, require('./api/' + config.api + '/routes'));

var server = http.createServer(app);

server.listen(config.port, function (err) {
    if (err)
        logger.error("Server error", {"message": err})
    else
        logger.info('server running at  ' + config.port);

});



