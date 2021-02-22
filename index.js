//module.exports = require('./src/bots')
const { platform, router, telegram, viber } = require('bottender/router');
const { logger } = require('./src/log')

async function TelegramDefaultAction(context) {
    if(context.event.isMessage) {
        const user = context.event.message.from
        logger.info('telegram client id:' + user.id + ', username: ' + user.username);
        await context.sendText(`Hi, ${user.firstName}! `);
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
        //text('/start', ShowKeyboard),
        //telegram.callbackQuery(AnswerKeyboard),
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
