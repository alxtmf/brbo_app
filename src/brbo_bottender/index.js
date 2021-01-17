const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const UsersService = require('../services/users.service')
const { logger }= require('../log')
const { SENT_THRESHOLD, NO_SENT_THRESHOLD, TELEGRAM_ACCESS_TOKEN, VIBER_ACCESS_TOKEN } = process.env
const { getClient } = require('bottender');
const { router, telegram, viber, text } = require('bottender/router');

const telegramClient = getClient('telegram')
const viberClient = getClient('viber')

//delete sent messages every 1 min.
module.exports.task = cron.schedule('* */1 * * *', function () {

    console.log('schedule task: delete sent messages')

    // delete SENT MESSAGES
    MessagesService.deleteSentMessages({ threshold: SENT_THRESHOLD })
        .then(result => {
            console.log(result + ' msgs is deleted')
        })

    // delete NO SENT MESSAGES
    MessagesService.deleteNoSentMessages({ threshold: NO_SENT_THRESHOLD })
        .then(result => {
            console.log(result + ' msgs is deleted')
        })

}, {
    scheduled: true,
    timezone: 'Asia/Irkutsk'
});


//send to bot every 5 sec.
module.exports.taskSentMessages = cron.schedule('*/30 * * * * *', function () {

    console.log('schedule task: send messages')

    MessagesService.getMessagesToSend("0, 2, 3")
        .then(result => {
            result.allRegSentMessages.nodes.forEach(async (node) => {
                console.log('sending message (to user:' + node.idUser + ', text:' + node.text + ')')

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

async function ShowKeyboard(context) {
    let id = context._session.id.split(':')[1] || '';
    console.log(id);
    UsersService.findAll(id)
        .then(async (data) => {
            if(id && data.allRegMessengerUsers.nodes.length) {
                await context.sendText(mainMenu.text, {replyMarkup: mainMenu.replyMarkup});
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
    const data = callbackQuery.data;
    const menu = menuMapping[data];
    if (menu) {
        await context.editMessageText(messageId, menu.text, {
            replyMarkup: menu.menu,
        });
    } else {
        await context.editMessageText(messageId, `Your final choice is ${data}.`);
    }
}

module.exports = async function App(context) {
    return router([
        text('/start', ShowKeyboard),
        telegram.callbackQuery(AnswerKeyboard),
        telegram.any(DefaultAction),

        viber.any(DefaultAction)
    ]);
};
