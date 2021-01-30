require('dotenv').config()
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const postgraphile = require('./postgraphile')
const routes = require('./routes/index')
const { logger }= require('./log')
// const scheduler = require('./schedules/scheduler')
const { bottender } = require('bottender');

const { PORT, NODE_ENV } = process.env

const app = bottender({
    dev: NODE_ENV !== 'production',
});

const handle = app.getRequestHandler();

app.prepare().then(() => {

    const server = express()

    const verify = (req, _, buf) => {
        req.rawBody = buf.toString();
    };
    server.use(bodyParser.json({ verify }));
    server.use(bodyParser.urlencoded({ extended: false, verify }));
    server.use(cors())
    server.use(postgraphile)
    server.use("/api", routes)

    server.all('*', (req, res) => {
        return handle(req, res);
    });

/*
    server.use(function (req, res, next) {
        res.status(404).send("Not Found")
    });
*/

//    scheduler.taskDeleteSentMessages.start()
//     scheduler.taskSentMessages.start()

    server.listen(PORT, err => {
        if (err) throw err;
        const msg = `Server running on ${NODE_ENV} mode on port ${PORT}`
        logger.info(msg)
    });
});
