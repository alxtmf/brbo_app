const cron = require('node-cron')
const delMsgController = require('../controllers/delMsgConroller')

module.exports.task = cron.schedule('* */1 * * *', function () {

    console.log('schedule task')

    delMsgController.delMessage()

}, {
    scheduled: true,
    timezone: 'Asia/Irkutsk'
})
