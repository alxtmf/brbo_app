const cron = require('node-cron')
const MessagesService = require('../services/messages.service')
const { SENT_THRESHOLD, NO_SENT_THRESHOLD } = process.env

module.exports.task = cron.schedule('* */1 * * *', function () {

    console.log('schedule task')

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
})
