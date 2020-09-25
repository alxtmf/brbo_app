const cron = require('node-cron')
const MessagesService = require('../services/messages.service')

module.exports.task = cron.schedule('* */1 * * *', function () {

    console.log('schedule task')

    //MessagesService.deleteMessage({})

}, {
    scheduled: true,
    timezone: 'Asia/Irkutsk'
})
