const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const { logger }= require('../log')
const { TIMEZONE, SENT_THRESHOLD, NO_SENT_THRESHOLD } = process.env
const { botList } = require('../bots/botlist')

//delete sent messages every 1 min.
module.exports.taskDeleteSentMessages = cron.schedule('* */1 * * *', function () {

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
    scheduled: false,
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
                                let tgmBotRecord = botList.get(item.idBot)
                                tgmBotRecord.bot.sendMessage(item.outerId, node.text)
                                    .then(async () => {
                                        await MessagesService.setMessageStatus({
                                            message: {uuid: node.uuid},
                                            status: 1
                                        });
                                        logger.info('   sent message "' + node.text + '" to bot: ' + item.botName + ' in messenger: ' + item.idMessenger)
                                    })
                                    .catch(async (err)=>{
                                        await MessagesService.setMessageStatus({
                                            message: {uuid: node.uuid},
                                            status: 3
                                        });
                                        logger.error('Error: send message "' + err)
                                    })
                                break;

                            case "VIBER":
                                let viberBotRecord = botList.get(item.idBot)
                                viberBotRecord.bot.sendText(item.outerId, node.text)
                                    .then(async () => {
                                        await MessagesService.setMessageStatus({
                                            message: {uuid: node.uuid},
                                            status: 1
                                        });
                                        logger.info('   success sent message "' + node.text + '" to bot: ' + item.botName + ' in messenger: ' + item.idMessenger)
                                    })
                                    .catch(async (err) => {
                                        await MessagesService.setMessageStatus({
                                            message: {uuid: node.uuid},
                                            status: 3
                                        });
                                        logger.error('Error: send message "' + err)
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
    scheduled: false,
    timezone: TIMEZONE
})
