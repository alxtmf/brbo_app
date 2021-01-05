require('dotenv').config()
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const postgraphile = require('./postgraphile')
const { logger }= require('./log')
const routes = require('./routes/index')
const scheduler = require('./schedules/scheduler')
const { bottender } = require('bottender');

const { PORT, NODE_ENV } = process.env

const botapp = bottender({
    dev: process.env.NODE_ENV !== 'production',
});

const handle = botapp.getRequestHandler();

botapp.prepare().then(() => {

    const server = express()
    server.use(cors())
    server.use(bodyParser.json())
    server.use(bodyParser.urlencoded({extended: false}))
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

    server.listen(PORT, () => {
        const msg = `Server running on ${NODE_ENV} mode on port ${PORT}`
        logger.info(msg)
    });
});
