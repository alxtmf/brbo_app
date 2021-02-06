require('dotenv').config()
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const postgraphile = require('./postgraphile')
const routes = require('./routes/index')
const { logger }= require('./log')
const { bottender } = require('bottender');
const ngrok = require('ngrok')

const { PORT, NODE_ENV } = process.env

// const telegramClient = getClient('telegram')
// const viberClient = getClient('viber')

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

    ngrok.connect({
        proto : 'http',
        addr : PORT,
    }).then(url => {
        console.log('Tunnel Created -> ', url);
        console.log('Tunnel Inspector ->  http://127.0.0.1:4040');

        server.listen(PORT, err => {
            if (err) throw err;
            const msg = `Server running on ${NODE_ENV} mode on port ${PORT}`
            logger.info(msg)

            // telegramClient.setWebhook(url).then(result => {
            //     logger.info('telegram webhook set successfully')
            // })
            // viberClient.setWebhook(url).then(result => {
            //     logger.info('viber webhook set successfully')
            // })


            // publicUrl.getPublicUrl().then(url => {
            //     console.log(url)
            //     telegramClient.setWebhook(url).then(() => console.log('telegram webhook is setting'))
            //     //viberClient.setWebhook(url).then(() => console.log('viber webhook is setting'))
            // })

        });

    })
        .catch(err => {
            console.error('Error while connecting Ngrok', err);
            return new Error('Ngrok Failed');
        })
});
