const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const { SENT_THRESHOLD, NO_SENT_THRESHOLD } = process.env
const { logger }= require('./../log')
const { router, telegram, text } = require('bottender/router');

//send to bot every 5 sec.
cron.schedule('*!/30 * * * * *', async function (context) {

    logger.info('scheduled task: send messages')

    await sendMsg(context);

}, {
    scheduled: true,
    timezone: 'Asia/Irkutsk'
})

async function sendMsg(context){
    MessagesService.getMessagesToSend("0, 2, 3")
        .then(result => {
            result.allRegSentMessages.nodes.forEach(async (node) => {
                logger.info('sending message (to user:' + node.idUser + ', text:' + node.text + ')')

                await MessagesService.getMessengerUserMessageRoutes(node.idUser)
                    .then(async(result)=>{
                        for (const item of result.allVMessengerUserMessageRoutes.nodes) {
                            switch (item.messengerCode) {
                                case "TELEGRAM":
                                    //await sendMessage(node.text)
                                    console.log(context.platform);
                                    await context.sendText(node.text);
                                    /*
                                                                                                            telegramBot.sendMessage(item.outerId, node.text)
                                                                                                                .then(async () => {
                                                                                                                    await MessagesService.setMessageStatus({
                                                                                                                        message : { uuid: node.uuid },
                                                                                                                        status: 1
                                                                                                                    });

                                                                                                                })
                                                                                                            console.log('   send message "' + node.text + '" to bot: ' +item.botName + ' in messenger: ' + item.idMessenger)
                                    */
                                    break;
                                case "VIBER":
                                    break;
                            }
                        }

                    })
                    .catch(reason => console.log('error'))
            })
        })
}

async function DefaultAction(context) {
    await context.sendText('Please type "show keyboard" to show the keyboard.');
}

function ShowHi(context) {
    context.sendText('hello');
}

module.exports = async function App(context) {
    await context.sendText('Hello bot');

    return router([
        text('hi', ShowHi),
        telegram.callbackQuery(ShowHi),
        telegram.any(DefaultAction),
    ]);
};

/*
const { router, telegram, text } = require('brbo_bottender/router');

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
    await context.sendText('Please type "show keyboard" to show the keyboard.');
}

async function ShowKeyboard(context) {
    await context.sendText(mainMenu.text, { replyMarkup: mainMenu.replyMarkup });
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
        text('show keyboard', ShowKeyboard),
        telegram.callbackQuery(AnswerKeyboard),
        telegram.any(DefaultAction),
    ]);
};
*/
