const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const { SENT_THRESHOLD, NO_SENT_THRESHOLD } = process.env
const { logger }= require('./../log')
//const TelegramBot = require('node-telegram-bot-api')

//const token = process.env.TELEGRAM_ACCESS_TOKEN

//telegramBot = new TelegramBot(token)

//delete sent messages every 1 min.
module.exports.taskDeleteSentMessages = cron.schedule('* */1 * * *', function () {

    logger.info('scheduled task: delete sent messages')

    // delete SENT MESSAGES
    MessagesService.deleteSentMessages({ threshold: SENT_THRESHOLD })
        .then(result => {
            logger.info(result + ' msgs is deleted')
        })

    // delete NO SENT MESSAGES
    MessagesService.deleteNoSentMessages({ threshold: NO_SENT_THRESHOLD })
        .then(result => {
            logger.info(result + ' msgs is deleted')
        })

}, {
    scheduled: false,
    timezone: 'Asia/Irkutsk'
});


//send to bot every 5 sec.
module.exports.taskSentMessages = cron.schedule('*/30 * * * * *', function () {

    logger.info('scheduled task: send messages')

    MessagesService.getMessagesToSend("0, 2, 3")
        .then(result => {
            result.allRegSentMessages.nodes.forEach(async (node) => {
                logger.info('sending message (to user:' + node.idUser + ', text:' + node.text + ')')

                await MessagesService.getMessengerUserMessageRoutes(node.idUser)
                    .then(async(result)=>{
                        for (const item of result.allVMessengerUserMessageRoutes.nodes) {
                            // bot.sendMessage(item.idMessenger, node.text)
                            // bot.sendMessage(-428599075, node.text)
                            // bot.sendMessage(463388832, node.text)
                            switch (item.messengerCode) {
                                case "TELEGRAM":
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
            })
        })
}, {
    scheduled: false,
    timezone: 'Asia/Irkutsk'
})

