var fs = require('fs');
var path = require('path');
var rfs = require('rotating-file-stream');
var winston = require('winston');
var logDirectory = __dirname + '/../../../logs';
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);// create a rotating write stream

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.label({ label: 'payment-gateway' }),
        winston.format.timestamp(),
        winston.format.prettyPrint()
    ),
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.File({ filename: logDirectory + '/error.log', level: 'error' }),
        new winston.transports.File({ filename: logDirectory + '/combined.log' })
    ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
