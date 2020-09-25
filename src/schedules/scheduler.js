const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const { SENT_THRESHOLD, NO_SENT_THRESHOLD } = process.env

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
                        result.allVMessengerUserMessageRoutes.nodes.forEach(bot=>{
                            console.log('   send message "' + node.text + '" to bot: ' +bot.botName + ' in messenger: ' + bot.idMessenger)
                        })

                    })
            })
            console.log(' msgs is sent')
        })


}, {
    scheduled: true,
    timezone: 'Asia/Irkutsk'
})

