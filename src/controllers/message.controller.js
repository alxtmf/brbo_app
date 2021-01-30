const {logger } = require("../log");
const MessageService = require('../services/messages.service')
const IncomRequestService = require('../services/incomRequest.service')
/*
test query in Postman
curl --location --request POST 'localhost:3000/message/send' \
--header 'Content-Type: application/json' \
--data-raw '{ "messages": [
    { "event_type": "EVENT_1", "user_id": "login1", "text": "message_text"}
]}'
 */

class MessageController {

    sendMessage(req, res) {
        if (!req.body) return res.sendStatus(400);

        const messages = req.body.messages

        const promises = messages.map(async (message) => {
            try {
                let data = await MessageService.findEventTypeByMessage(message)
                if (!data || data[0].uuid == "" && data[0].clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges.length == 0) {
                    throw message
                } else {
                    message.idEventType = data[0].uuid
                    message.idTargetSystem = data[0].idTargetSystem
                    message.idUser = data[0].clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges[0].node.idUser

                    if (message.id_incom_request) {
                        await IncomRequestService.saveIncomRequest(2, message.id_incom_request)
                            .then(() => {
                                logger.info('message.id_incom_request (' + message.id_incom_request + ') status is set=2')
                            })
                            .catch(() => {
                                logger.error('message.id_incom_request (' + message.id_incom_request + ') error set status')
                            })
                    }
                    return await MessageService.createMessage(message)
                }
            } catch (e) {
                logger.error(e)
                throw message
            }
        })

        Promise.allSettled(promises).then((result) => {
            res.send(result)
        })
    }
}

module.exports = new MessageController();

