const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const UsersService = require('../services/users.service')
const { logger }= require('../log')
const { TIMEZONE, SENT_THRESHOLD, NO_SENT_THRESHOLD } = process.env
const { getClient } = require('bottender');
const { platform, router, telegram, viber, text } = require('bottender/router');
// const publicUrl = require('../get_public_url')

const telegramClient = getClient('telegram')
const viberClient = getClient('viber')

// publicUrl.getPublicUrl().then(url => {
//     console.log(url)
//     telegramClient.setWebhook(url).then(() => console.log('telegram webhook is setting'))
//     viberClient.setWebhook(url).then(() => console.log('viber webhook is setting'))
// })


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

    MessagesService.getMessagesToSend("0, 2, 3")
        .then(result => {
            result.forEach(async (node) => {
                logger.info('sending message (to user:' + node.idUser + ', text:' + node.text + ')')

                try {
                    result = await MessagesService.getMessengerUserMessageRoutes(node.idUser)
                    for (const item of result) {
                        switch (item.messengerCode) {
                            case "TELEGRAM":
                                telegramClient.sendMessage(item.outerId, node.text)
                                    .then(async () => {
                                        await MessagesService.setMessageStatus({
                                            message: {uuid: node.uuid},
                                            status: 1
                                        });
                                        logger.info('   sent message "' + node.text + '" to bot: ' + item.botName + ' in messenger: ' + item.idMessenger)
                                    })
                                break;
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

async function DefaultAction(context) {
    if(context.event.isMessage) {
        await context.sendText('Please type "/start" to show the keyboard.');
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
        telegram.any(DefaultAction),
    ]);
}

async function ViberActions(context){
    return router([
        text('/start', ShowKeyboard),
        viber.any(DefaultAction)
    ]);
}

module.exports = async function App(context) {
    return router([
        platform('telegram', TelegramActions),
        platform('viber', ViberActions),
    ]);
};
