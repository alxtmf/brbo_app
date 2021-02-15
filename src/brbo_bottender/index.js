const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const UsersService = require('../services/users.service')
const BotsService = require('../services/bots.service')
const { logger }= require('../log')
const { TIMEZONE, SENT_THRESHOLD, NO_SENT_THRESHOLD } = process.env
//const { getClient } = require('bottender');
const { platform, router, telegram, viber, text } = require('bottender/router');
const { TELEGRAM_ACCESS_TOKEN } = process.env

//const telegramClient = getClient('telegram')
//const viberClient = getClient('viber')
//const telegramClient = require('../server')

const { TelegramClient } = require('messaging-api-telegram');
const { ViberClient } = require('messaging-api-viber');

const telegramClient = new TelegramClient({
    accessToken: TELEGRAM_ACCESS_TOKEN,
});

let botList = new Map();

module.exports.createBotList = function(public_url) {
    BotsService.findAll()
        .then(bots => {
            bots.forEach(bot => {
                let client = {
                    id: bot.uuid,
                    code: bot.code,
                    name: bot.name,
                    messenger: bot.clsMessengerByIdMessenger.code,
                    bot: null
                };
                switch (bot.clsMessengerByIdMessenger.code) {
                    case 'TELEGRAM':
                        client.bot = new TelegramClient({
                            accessToken: JSON.parse(bot.settings).access_token,
                        });
                        break;
                    case 'VIBER':
                        client.bot = new ViberClient({
                            accessToken: JSON.parse(bot.settings).access_token,
                        });
                }
                if (client.bot) {
                    client.bot.setWebhook(public_url)
                        .then((result) => logger.info('set webhook success'))
                        .catch(()=> logger.info('set webhook - error'))
                    //botList.push(client)
                    botList.set(client.id, client)
                }
            })
        })
        .catch(() => {
            logger.error('error get data from clsBot')
        })
    return botList
}
// ************************************* SCHEDULE ************************************************************

//delete sent messages every 1 min.
module.exports.task = cron.schedule('* */1 * * *', function () {

    //console.log('schedule task: delete sent messages')

    // delete SENT MESSAGES
    MessagesService.deleteSentMessages({ threshold: SENT_THRESHOLD })
        .then(result => {
            logger.debug(result + ' msgs is deleted')
        })

    // delete NO SENT MESSAGES
    MessagesService.deleteNoSentMessages({ threshold: NO_SENT_THRESHOLD })
        .then(result => {
            logger.debug(result + ' msgs is deleted')
        })

}, {
    scheduled: true,
    timezone: TIMEZONE
});


//send to bot every 5 sec.
module.exports.taskSentMessages = cron.schedule('*/30 * * * * *', function () {

    botList.forEach(bot => console.log(bot))


    MessagesService.getMessagesToSend("0, 2, 3")
        .then(result => {
            result.forEach(async (node) => {
                logger.info('sending message (to user:' + node.idUser + ', text:' + node.text + ')')

                try {
                    result = await MessagesService.getMessengerUserMessageRoutes(node.idUser)
                    for (const item of result) {
                        switch (item.messengerCode) {
                            case "TELEGRAM":
                                let bot = botList.get(item.idBot)
                                console.log(bot.name + ', ' + bot.bot.token)
                                //const msg = await telegramClient.sendMessage(item.outerId, node.text)
                                const msg = await bot.bot.sendMessage(item.outerId, node.text)
                                if(msg){
                                    await MessagesService.setMessageStatus({
                                        message: {uuid: node.uuid},
                                        status: 1
                                    });
                                    logger.info('   sent message "' + node.text + '" to bot: ' + item.botName + ' in messenger: ' + item.idMessenger)
                                }
                                break;
/*
                            case "VIBER":
                                viberClient.sendText(item.outerId, node.text)
                                    .then(async () => {
                                        await MessagesService.setMessageStatus({
                                            message: {uuid: node.uuid},
                                            status: 1
                                        });
                                        logger.info('   sent message "' + node.text + '" to bot: ' + item.botName + ' in messenger: ' + item.idMessenger)
                                    })
                                break;
*/
                        }
                    }
                } catch(err){
                    logger.error(err);
                }
            })
        })
}, {
    scheduled: true,
    timezone: TIMEZONE
})


//  ******************************************* KEYBOARD **********************************************************
/*

function generateEventTypeKeyboard(table) {
    return {
        inlineKeyboard: table.map(row =>
            row.map(cell => ({
                text: cell.text,
                callbackData: cell.code,
            }))
        ),
    };
}

async function TelegramDefaultAction(context) {
    if(context.event.isMessage) {
        const user = context.event.message.from || 'user'
        console.log('message from telegram client - id:' + user.id + ', username: ' + user.username)
        logger.info('telegram client id:' + user.id + ', username: ' + user.username);
        await context.sendText('Hi, ' + user.firstName + '! Please type "/start" to show the keyboard.');
    }
}

async function ViberDefaultAction(context) {
    if(context.event.isMessage) {
        const user = context.event._rawEvent.sender || 'user'
        console.log("message from viber client - id:  " + user.id + ", name: " + user.name)
        logger.info("viber client user.id:  " + user.id + ", user.name: " + user.name)
        await context.sendText('Hi, '+user.name+'! Please type "/start" to show the keyboard.');
    }
}

function buildTelegramKeyboard(keysArr){
    let arr = []
    keysArr.forEach(eventType => {
        arr.push(Array.of({code: eventType.code, text: eventType.name}))
    })
    return generateEventTypeKeyboard(arr)
}

async function ShowKeyboard(context) {
    let id = context._session.id.split(':')[1] || '';

    //let eventTypeCode = context._session.code || null

    UsersService.findAll(id)
        .then(async (data) => {
            if(id && data.length) {
                MessagesService.getUserKeyboardData(
                    data[0].clsUserByIdUser.uuid,
                    data[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes[0].uuid,
                    null
                ).then(async (result) => {
                    //TODO build and return keyboard
                    if(result) {
                        if (result.length) {
                            if (context.platform === 'telegram') {
                                await context.sendText('please click an option',
                                    {replyMarkup: buildTelegramKeyboard(result)}
                                )
                            }
                            if (context.platform === 'viber') {
                                // await context.sendText('please click an option',
                                //     {replyMarkup: buildViberKeyboard(data.allClsEventTypes.nodes)}
                                // )
                            }
                        } else {
                            await context.sendText(`It is Your final choice is null`);
                        }
                    } else {
                        await context.sendText('You are not authorized')
                    }
                })
            } else {
                await context.sendText('You are not authorized')
            }
        })
        .catch(async (err)=> {
            await context.sendText('You are not authorized')
        })
}

async function AnswerKeyboard(context) {
    const callbackQuery = context.event.callbackQuery;
    const messageId = callbackQuery.message.messageId;
    const eventTypeCode = callbackQuery.data;

    const id = context._session.id.split(':')[1] || '';

    try {
        const data = await UsersService.findAll(id)
        if(id && data.length) {
            // build and return keyboard
            const kbData = MessagesService.getUserKeyboardData(
                data[0].clsUserByIdUser.uuid,
                data[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes[0].uuid,
                eventTypeCode
            )
            if(kbData) {
                if (context.platform === 'telegram') {
                    await context.editMessageText(messageId, callbackQuery.message.text, {
                        replyMarkup: buildTelegramKeyboard(kbData),
                    });
                }
            } else {
                await context.editMessageText(messageId, `Your final choice is ${eventTypeCode}.`);
            }
        } else {
            await context.sendText('You are not authorized')
        }
    } catch(err) {
        await context.sendText('You are not authorized')
    }
}

async function TelegramActions(context){
    return router([
        text('/start', ShowKeyboard),
        telegram.callbackQuery(AnswerKeyboard),
        telegram.any(TelegramDefaultAction),
    ]);
}

async function ViberActions(context){
    return router([
        text('/start', ShowKeyboard),
        viber.any(ViberDefaultAction)
    ]);
}

module.exports.telegramClient = telegramClient
module.exports.viberClient = viberClient

module.exports = async function App(context) {
    return router([
        platform('telegram', TelegramActions),
        platform('viber', ViberActions),
    ]);
};
*/
