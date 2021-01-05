const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const { SENT_THRESHOLD, NO_SENT_THRESHOLD, TELEGRAM_ACCESS_TOKEN } = process.env
const { TelegramClient } = require('messaging-api-telegram');
const { ViberClient } = require('messaging-api-viber');

// get authToken from the "edit info" screen of your Public Account.
const viberClient = new ViberClient({
    accessToken: 'AUTH_TOKEN',
    sender: {
        name: 'Sender',
    },
});
const telegramClient = new TelegramClient({
    accessToken: TELEGRAM_ACCESS_TOKEN,
});


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

                                        })
                                    console.log('   send message "' + node.text + '" to bot: ' +item.botName + ' in messenger: ' + item.idMessenger)
                                    break;
                                case "VIBER":
                                    viberClient.sendText(item.outerId, node.text)
                                        .then(()=>{
                                            console.log('msg is sent')
                                        })
                                    break;
                            }
                        }

                    })
                    .catch(err => console.log('error: ' + err))
            })
        })
}, {
    scheduled: true,
    timezone: 'Asia/Irkutsk'
})

