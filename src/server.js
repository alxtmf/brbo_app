require('dotenv').config()
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const postgraphile = require('./postgraphile')
const routes = require('./routes/index')
const { logger }= require('./log')
const ngrok = require('ngrok')
const { PORT, NODE_ENV } = process.env
const { createBotList } = require('./bots')
const { taskSentMessages, taskDeleteSentMessages } = require('./schedules/scheduler')

const server = express()

const verify = (req, _, buf) => {
    req.rawBody = buf.toString();
};

server.use(bodyParser.json({ verify }));
server.use(bodyParser.urlencoded({ extended: false, verify }));
server.use(cors())
server.use(postgraphile)
server.use("/api", routes)

ngrok.connect({
    proto : 'http',
    addr : PORT,
})
    .then(url => {
        logger.info('Tunnel Created -> ', url);
        logger.info('Tunnel Inspector ->  http://127.0.0.1:4040');

        server.listen(PORT, err => {
            if (err) throw err;
            const msg = `Server running on ${NODE_ENV} mode on port ${PORT}`
            logger.info(msg)

            createBotList(url)
                .then((botList) => {
                    logger.info('Count active bots: ' + botList.size)
                })
                .catch((err) => {
                    logger.error(err)
                })

            taskSentMessages.start()
            taskDeleteSentMessages.start()
        })
    })
    .catch(err => {
    console.error('Error while connecting Ngrok', err);
    return new Error('Ngrok Failed');
})
