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

    createMessage(req, res) {
        if (!req.body) return res.sendStatus(400);

        const messages = req.body.messages

        const promises = messages.map(async (message) => {
            try {
                let data = await MessageService.findEventTypeByMessage(message)
                if (!data || data[0].uuid == "" || data[0].clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges.length == 0) {
                    throw `not found route | not found eventTypes | user not found`
                } else {
                    message.idEventType = data[0].uuid
                    message.idTargetSystem = data[0].idTargetSystem
                    message.idUser = data[0].clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges[0].node.idUser

                    if (message.id_incom_request) {
                        const isUpdated = await IncomRequestService.setIncomRequestStatus(message.id_incom_request, 2)
                        if(isUpdated){
                            logger.info('message.id_incom_request (' + message.id_incom_request + ') status is set=2')
                        } else {
                            logger.error('message.id_incom_request (' + message.id_incom_request + ') error set status')
                        }
                    }

                    return await MessageService.addMessage(message)
                }
            } catch (e) {
                logger.error(`createMessage error: ${e}`)
                throw `createMessage error: ${e}`
            }
        })

        Promise.allSettled(promises).then((result) => {
            res.send(result)
        })
    }
}

module.exports = new MessageController();

