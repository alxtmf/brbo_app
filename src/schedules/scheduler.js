const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const IncomRequestService = require('../services/incomRequest.service')
const { logger }= require('../log')
const { TIMEZONE, MSG_SENT_THRESHOLD, MSG_NO_SENT_THRESHOLD, REQ_SENT_THRESHOLD, REQ_NO_SENT_THRESHOLD, REQ_READ_THRESHOLD } = process.env
//const { botList } = require('../bots/botlist')
const { getClient } = require('bottender')

//check delete sent messages every 1 day.
module.exports.taskDeleteSentMessages = cron.schedule('32 11 */1 * *', function () {

    // delete SENT MESSAGES
    MessagesService.deleteSentMessages({ threshold: MSG_SENT_THRESHOLD })
        .then(result => {
            logger.debug(result + ' msgs is deleted')
        })

    // delete NO SENT MESSAGES
    MessagesService.deleteNoSentMessages({ threshold: MSG_NO_SENT_THRESHOLD })
        .then(result => {
            logger.debug(result + ' msgs is deleted')
        })

    // delete SENT REQUESTS
    IncomRequestService.deleteSentRequests({ threshold: REQ_SENT_THRESHOLD })
        .then(result => {
            logger.debug(result + ' msgs is deleted')
        })

    // delete NO SENT REQUESTS
    IncomRequestService.deleteNoSentRequests({ threshold: REQ_NO_SENT_THRESHOLD })
        .then(result => {
            logger.debug(result + ' msgs is deleted')
        })

    // delete READ REQUESTS
    IncomRequestService.deleteReadRequests({ threshold: REQ_READ_THRESHOLD })
        .then(result => {
            logger.debug(result + ' msgs is deleted')
        })

}, {
    scheduled: false,
    timezone: TIMEZONE
});


//send to bot every 30 sec.
module.exports.taskSentMessages = cron.schedule('*/30 * * * * *', function () {

    MessagesService.getMessagesToSend("0, 2, 3")
        .then(message => {
            message.forEach(async (node) => {
                logger.info(`sending message ${node.uuid} (to user: ${node.idUser})`)

                try {
                    let userMsgRoute = await MessagesService.getMessengerUserMessageRoutes(node.idUser, node.idEventType)
                    let error_sending = 'sending error'

                    for (const item of userMsgRoute) {
                        switch (item.messengerCode.toUpperCase()) {
                            case "TELEGRAM":
                                let tgmBotRecord = getClient(item.botCode)

                                // if (node.attachedFile){
                                //     tgmBotRecord.bot.sendDocument(item.outerId, node.attachedFile)
                                // } else {
                                try {
                                    await tgmBotRecord.sendMessage(item.outerId, node.text)
                                    error_sending = ''
                                    logger.info(`send to telegram - success`)
                                } catch (e) {
                                    logger.error('[sendMessage]: ' + e)
                                    error_sending = 'error sending via telegram client'
                                }
                                // }
                                break;

                            case "VIBER":
                                let viberBotRecord = getClient(item.botCode)
                                try {
                                    await viberBotRecord.sendText(item.outerId, node.text)
                                    error_sending = ''
                                    logger.info(`send to viber - success`)
                                } catch (e) {
                                    logger.error('[sendMessage]: ' + e)
                                    error_sending = 'error sending via viber client'
                                }
                                break;
                        }
                    }

                    if (!error_sending) {
                        await MessagesService.setMessageStatus({
                            message: {uuid: node.uuid},
                            status: 1
                        });
                        if(node.idIncomRequest && node.idIncomRequest != 0) {
                            await IncomRequestService.setIncomRequestStatus(node.idIncomRequest, 3)
                        }
                        logger.info(`set status 'sent'`)
                    } else {
                        await MessagesService.setMessageStatus({
                            message: {uuid: node.uuid},
                            status: 3
                        });
                        logger.error('[sendMessage]: ' + error_sending)
                        logger.info(`set status '3 - error send'`)
                    }

                } catch (err) {
                    await MessagesService.setMessageStatus({
                        message: {uuid: node.uuid},
                        status: 2
                    });
                    logger.error('[sendMessage]: ' + err)
                    logger.info(`set status '2 - error send'`)
                }
            })
        })
}, {
    scheduled: false,
    timezone: TIMEZONE
})
