const BotService = require('../services/bot.service')
const { logger }= require('../log')
const { TelegramClient } = require('messaging-api-telegram');
const { ViberClient } = require('messaging-api-viber');
const { botList } = require('./botlist')

// ************************************* CREATE BOT LIST ************************************************************

module.exports.createBotList = function(public_url) {
    return new Promise((resolve, reject) => {
        BotService.findAll()
            .then(bots => {
                if(bots.size == 0){
                    reject('error get bot list')
                }

                bots.forEach(bot => {
                    let client = {
                        id: bot.uuid,
                        code: bot.code,
                        name: bot.name,
                        messenger: bot.clsMessengerByIdMessenger.code,
                        bot: null
                    };

                    const settings = JSON.parse(bot.settings)
                    const path = settings.path
                    switch (bot.clsMessengerByIdMessenger.code.toUpperCase()) {
                        case 'TELEGRAM':
                            client.bot = new TelegramClient({
                                accessToken: settings.accessToken,
                            });
                            break;
                        case 'VIBER':
                            client.bot = new ViberClient({
                                accessToken: settings.accessToken,
                                sender: settings.sender
                            });
                    }
                    if (client.bot) {
                        client.bot.setWebhook(public_url + path)
                            .then((result) => logger.info('set webhook success'))
                            .catch((err)=> logger.info(`set webhook - error: ${err}`))
                        botList.set(client.id, client)
                    }
                })

                resolve(botList)
            })
            .catch((err) => {
                const errMsg = 'error get data from clsBot: ' + err
                logger.error(errMsg)
                reject(errMsg)
            })
    })
}


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
