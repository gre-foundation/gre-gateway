// db.js
var config = require('./config');
var orm = require('orm');

var connections = {};

module.exports = function (host, database) {
    return new Promise(function (resolve, reject) {
        if (connections[host] && connections[host][database]) {
            resolve(connections[host][database]);
        } else {
            var opts = config.mysql;

            orm.connect(opts, function (err, db) {
                if (err) {
                    reject(err);
                } else {
                    connections[host] = connections[host] || {};
                    connections[host][database] = db;
                    db.load(__dirname + "/models/models", function (err) {
                        resolve(db);
                    })
                }
            });
        }
    })
};
