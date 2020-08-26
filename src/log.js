const winston = require('winston')
const logformat = winston.format.combine(
    winston.format.json(),
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf(info => `${info.timestamp}_${info.level}: ${info.message}`)
);
const infoLogFilename = 'logs/info.log'
const errorLogFilename = 'logs/error.log'

const logger = {
    log: winston.createLogger({
        level: 'info',
        format: logformat,
        transports: [
            new winston.transports.File({
                filename: errorLogFilename,
                level: 'error',
                format: winston.format.json()
            }),
            new winston.transports.File({
                filename: infoLogFilename,
                level: 'info',
                format: winston.format.json()
            }),
            new winston.transports.Console({
                level: 'info',
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            })
        ],
    })
};

module.exports.errorLogFilename = errorLogFilename
module.exports.infoLogFilename = infoLogFilename
module.exports.logger = logger

