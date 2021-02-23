const { platform, router, text, telegram, viber } = require('bottender/router');
const { logger } = require('../log')
const UsersService = require('../services/users.service')
const MessagesService = require('../services/messages.service')
const EventTypeService = require('../services/eventTypes.service')
const IncomRequestService = require('../services/incomRequest.service')


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

function buildTelegramKeyboard(keysArr){
    let arr = []
    keysArr.forEach(eventType => {
        arr.push(Array.of({code: eventType.code, text: eventType.name}))
    })
    return generateEventTypeKeyboard(arr)
}

async function ShowKeyboard(context) {
    const userId = context._session.user.id
    const botToken = context._client._token

    await UsersService.findAll(userId)
        .then(async (data) => {
            if(userId && data.length) {
                //find bot by accessToken
                let bot = {}
                data[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes
                    .forEach(item => {
                        let settings = JSON.parse(item.settings)
                        if(settings.access_token == botToken){
                            bot = item
                        }
                    })

                // if(!bot) throw 'bot not found'

                MessagesService.getUserKeyboardData(
                    data[0].clsUserByIdUser.uuid,
                    bot.uuid,
                    //data[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes,
                    null
                ).then(async (result) => {
                    //build and return keyboard
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

    const userId = context._session.user.id
    const botToken = context._client._token

    try {
        await UsersService.findAll(userId)
            .then(async (data) => {
                if (userId && data.length) {
                    //find bot by accessToken
                    let bot = {}
                    data[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes
                        .forEach(item => {
                            let settings = JSON.parse(item.settings)
                            if (settings.access_token == botToken) {
                                bot = item
                            }
                        })

                    if(bot){
                        // find eventType
                        const eventType = await EventTypeService.findEventTypeByCodeAndType(eventTypeCode, 1)

                        const result = await IncomRequestService.addIncomRequest({
                            idBot: bot.uuid,
                            idMessenger: bot.idMessenger,
                            idEventType: eventType[0].uuid,
                            idTargetSystem: eventType[0].idTargetSystem,
                            idUser: data[0].clsUserByIdUser.uuid
                        })

                        if(result) {
                            await context.sendText('Request send successfully')
                        } else {
                            await context.sendText('Error sending request')
                        }

                    }
                }
            })
    } catch(err) {
        await context.sendText('You are not authorized')
    }
}




async function TelegramDefaultAction(context) {
    if(context.event.isMessage) {
        const user = context.event.message.from
        logger.info('telegram client id:' + user.id + ', username: ' + user.username);
        await context.sendText(`Hi, ${user.firstName}! You are send message: ${context.event.message.text}`);
    }
}

async function ViberDefaultAction(context) {
    if(context.event.isMessage) {
        const user = context.event._rawEvent.sender
        logger.info("viber client user.id:  " + user.id + ", user.name: " + user.name)
        await context.sendText(`Hi, ${user.name}! `);
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
        //text('/start', ShowKeyboard),
        viber.any(ViberDefaultAction)
    ]);
}

module.exports = async function App(context) {
    return router([
        platform('telegram', TelegramActions),
        platform('viber', ViberActions),
    ]);
};
