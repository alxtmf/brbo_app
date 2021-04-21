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

    try{
        const check = await UsersService.checkAuthUser(userId, botToken)

        if(check) {
            const keyboard = await MessagesService.getUserKeyboardData(
                        check.clsUser.uuid,
                        check.bot.uuid,
                        //data[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes,
                        null
                    )
            //build and return keyboard
            if (keyboard) {
                if (keyboard.length) {
                    if (context.platform === 'telegram') {
                        await context.sendText('Пожалуйста, выберите запрос',
                            {replyMarkup: buildTelegramKeyboard(keyboard)}
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
                await context.sendText('Для вас не установлены запросы')
            }
        } else {
            await context.sendText(getNoAuthText())
        }
    } catch(e) {
        logger.error(`[ShowKeyboard]: ${e}`)
        await context.sendText('Упс. Похоже, что сервис пока недоступен. Попробуйте позже или обратитесь к администратору.')
    }
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
                            if (settings.accessToken == botToken) {
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
        await context.sendText(getNoAuthText())
    }
}


async function ActivateTgUser(context){
    if(context.event.isMessage) {
        const user = context.event.message.from
        const ident = context.event.message.text.replace('/register', '').trim()
        const botToken = context._client._token

        if(ident) {
            const check = await UsersService.checkAuthUser(user.id, botToken)

            if(!check) {
                logger.info('register telegram client id:' + user.id + ', username: ' + user.username + ', identificator: ' + ident);
                const result = await UsersService.activateUser(user, botToken, ident)
                if(result){
                    await context.sendText(`Поздравляем, ${user.firstName}! Ваш профиль активирован.`);
                } else {
                    await context.sendText(`Попробуйте позже`);
                }
            } else {
                await context.sendText(`Привет, ${user.firstName}! Вы уже зарегистрированы в системе`);
            }

        } else {
            await context.sendText(`Пустое значение идентификатора`);
        }
    }
}

function getNoAuthText(){
    return "Похоже, что Вы не зарегистрированы. Пожалуйста, свяжитесь в администратором.\n" +
        "Если знаете свой идентификатор - отправьте сообщение \"/register <идентификатор>\" для активации профиля."
}

async function TelegramDefaultAction(context) {
    if(context.event.isMessage) {
        const user = context.event.message.from
        const botToken = context._client._token

        logger.info('telegram client id:' + user.id + ', username: ' + user.username);
        //1. проверить регистрацию
        const check = await UsersService.checkAuthUser(user.id, botToken)

        if(!check) {
            //2. если нет регистрации - сообщение "Похоже, что Вы не зарегистрированы. Пожалуйста, свяжитесь в администратором.
            // Если знаете свой код доступа - отправьте сообщение "/register <код доступа>" для активации аккаунта."
            await context.sendText(getNoAuthText())
        } else {
            //3. если регистрация есть - приветственное сообщение
            await context.sendText(`Привет, ${user.firstName}! Вы написали: ${context.event.message.text}`);
        }
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
        text(/\/register (.+)/, ActivateTgUser),
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
