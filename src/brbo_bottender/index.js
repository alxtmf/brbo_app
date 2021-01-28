const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const UsersService = require('../services/users.service')
const { logger }= require('../log')
const { SENT_THRESHOLD, NO_SENT_THRESHOLD, TELEGRAM_ACCESS_TOKEN, VIBER_ACCESS_TOKEN } = process.env
const { getClient } = require('bottender');
const { platform, router, telegram, viber, text } = require('bottender/router');

const telegramClient = getClient('telegram')
const viberClient = getClient('viber')

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
    timezone: 'Asia/Irkutsk'
});


//send to bot every 5 sec.
module.exports.taskSentMessages = cron.schedule('*/30 * * * * *', function () {

    //console.log('schedule task: send messages')

    MessagesService.getMessagesToSend("0, 2, 3")
        .then(result => {
            result.allRegSentMessages.nodes.forEach(async (node) => {
                logger.info('sending message (to user:' + node.idUser + ', text:' + node.text + ')')

                await MessagesService.getMessengerUserMessageRoutes(node.idUser)
                    .then(async(result)=>{
                        for (const item of result.allVMessengerUserMessageRoutes.nodes) {
                            switch (item.messengerCode) {
                                case "TELEGRAM":
                                    telegramClient.sendMessage(item.outerId, node.text)
                                        .then(async () => {
                                            await MessagesService.setMessageStatus({
                                                message : { uuid: node.uuid },
                                                status: 1
                                            });
                                            logger.info('   sent message "' + node.text + '" to bot: ' +item.botName + ' in messenger: ' + item.idMessenger)
                                        })
                                    break;
                                case "VIBER":
                                    viberClient.sendText(item.outerId, node.text)
                                        .then(async () => {
                                            await MessagesService.setMessageStatus({
                                                message : { uuid: node.uuid },
                                                status: 1
                                            });
                                            logger.info('   sent message "' + node.text + '" to bot: ' +item.botName + ' in messenger: ' + item.idMessenger)
                                        })
                                    break;
                            }
                        }

                    })
                    .catch(err => {
                        console.log('error: ' + err)
                        logger.error(err);
                    })
            })
        })
}, {
    scheduled: true,
    timezone: 'Asia/Irkutsk'
})

// module.exports = async function App(context) {
//     if (context.event.isText) {
//         await context.sendText(`recieved the text message: ${context.event.text}`);
//     }
// };


function generateInlineKeyboard(table) {
    return {
        inlineKeyboard: table.map(row =>
            row.map(cell => ({
                text: cell,
                callbackData: cell,
            }))
        ),
    };
}

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

const mainMenu = {
    text: 'This is main menu, please click an option.',
    replyMarkup: generateInlineKeyboard([
        ['A', 'B'],
        ['C', 'D'],
    ]),
};

const submenuA = {
    text: 'This is submenu A.',
    replyMarkup: generateInlineKeyboard([
        ['A1', 'A2'],
        ['A3', 'A4'],
        ['< back to main menu'],
    ]),
};

const submenuB = {
    text: 'This is submenu B.',
    replyMarkup: generateInlineKeyboard([
        ['B1', 'B2'],
        ['B3', 'B4'],
        ['< back to main menu'],
    ]),
};

const submenuC = {
    text: 'This is submenu C.',
    replyMarkup: generateInlineKeyboard([
        ['C1', 'C2'],
        ['C3', 'C4'],
        ['< back to main menu'],
    ]),
};

const submenuD = {
    text: 'This is submenu D.',
    replyMarkup: generateInlineKeyboard([
        ['D1', 'D2'],
        ['D3', 'D4'],
        ['< back to main menu'],
    ]),
};

const menuMapping = {
    '< back to main menu': mainMenu,
    A: submenuA,
    B: submenuB,
    C: submenuC,
    D: submenuD,
};



async function DefaultAction(context) {
    await context.sendText('Please type "/start" to show the keyboard.');
}

function buildTelegramKeyboard(keysArr){
    let arr = []
    keysArr.forEach(eventType => {
        //console.log(eventType.code + ": " + eventType.name)
        arr.push(Array.of({code: eventType.code, text: eventType.name}))
    })
    return generateEventTypeKeyboard(arr)
}

async function ShowKeyboard(context) {
    let id = context._session.id.split(':')[1] || '';

    //let eventTypeCode = context._session.code || null

    UsersService.findAll(id)
        .then(async (data) => {
            if(id && data.allRegMessengerUsers.nodes.length) {
                MessagesService.getUserKeyboardData(
                    data.allRegMessengerUsers.nodes[0].clsUserByIdUser.uuid,
                    data.allRegMessengerUsers.nodes[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes[0].uuid,
                    null
                ).then(async (data) => {
                    //TODO build and return keyboard
                    if(data) {
                        if (data.allClsEventTypes.nodes.length) {
                            if (context.platform === 'telegram') {
                                await context.sendText('please click an option',
                                    {replyMarkup: buildTelegramKeyboard(data.allClsEventTypes.nodes)}
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

    UsersService.findAll(id)
        .then(async (data) => {
            if(id && data.allRegMessengerUsers.nodes.length) {
                // build and return keyboard
                MessagesService.getUserKeyboardData(
                    data.allRegMessengerUsers.nodes[0].clsUserByIdUser.uuid,
                    data.allRegMessengerUsers.nodes[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes[0].uuid,
                    eventTypeCode
                ).then(async (data) => {
                    if(data) {
                        if (context.platform === 'telegram') {
                            // await context.sendText('please click an option',
                            //     {replyMarkup: buildTelegramKeyboard(data.allClsEventTypes.nodes)}
                            // )
                            await context.editMessageText(messageId, callbackQuery.message.text, {
                                replyMarkup: buildTelegramKeyboard(data.allClsEventTypes.nodes),
                            });
                        }
                    } else {
                        //await context.sendText(`Your final choice is ${eventTypeCode}.`);
                        await context.editMessageText(messageId, `Your final choice is ${eventTypeCode}.`);
                    }
                })
            } else {
                await context.sendText('You are not authorized')
            }
        })
        .catch(async (err)=> {
            await context.sendText('You are not authorized')
        })
/*
    const menu = menuMapping[data];
    if (menu) {
        await context.editMessageText(messageId, menu.text, {
            replyMarkup: menu.menu,
        });
    } else {
        await context.editMessageText(messageId, `Your final choice is ${data}.`);
    }
*/
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
