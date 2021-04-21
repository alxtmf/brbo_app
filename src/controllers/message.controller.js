const {logger } = require("../log");
const MessageService = require('../services/messages.service')
const IncomRequestService = require('../services/incomRequest.service')
const fs = require('fs')
const { ATTACH_UPLOAD_DIR } = process.env
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
            return new Promise(async (resolve, reject) => {
                try {
                    let resMessage = message
                    let data = await MessageService.findEventTypeByMessage(message)
                    if (data.length == 0 || data[0].uuid == "" || data[0].clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges.length == 0) {
                        resMessage.status = `not found route/eventTypes/user`
                        return resolve(resMessage)
                    } else {
                        message.idEventType = data[0].uuid
                        message.idTargetSystem = data[0].idTargetSystem
                        message.idUser = data[0].clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges[0].node.idUser

                        if (message.attached_file){
                             // save to filesystem

                            if( !fs.existsSync(ATTACH_UPLOAD_DIR) ) {
                                fs.mkdirSync(ATTACH_UPLOAD_DIR, 0o755);
                            }

                            const fileName = 'attach_' + Date.now() +'.' + message.attached_file_type

                            fs.writeFile(ATTACH_UPLOAD_DIR + '/' + fileName,
                                message.attached_file,
                                { encoding: 'base64' },
                                function(err){
                                    if(!err) {
                                        logger.info('Attachment created');
                                    } else {
                                        logger.error('Error on attach file created')
                                    }
                                }
                            );

                            message.attached_file = fileName

                        } else {
                            message.attached_file = null
                            message.attached_file_type = null
                            message.attached_file_size = null
                            message.attached_file_hash = null
                        }

                        const result = await MessageService.addMessage(message)
                        resMessage.status = result ? 'created' : 'error create'

                        if (result && message.id_incom_request) {
                            const isUpdated = await IncomRequestService.setIncomRequestStatus(message.id_incom_request, 2)
                            if(isUpdated){
                                logger.info('message.id_incom_request (' + message.id_incom_request + ') status is set=2')
                            } else {
                                logger.error('message.id_incom_request (' + message.id_incom_request + ') error set status')
                            }
                        }
                    }
                    return resolve(resMessage)
                } catch (e) {
                    logger.error(`createMessage error: ${e}`)
                    reject(`createMessage error: ${e}`)
                }
            })
        })

        Promise.allSettled(promises).then((result) => {
            const messages = result.map(v => v.status == 'fulfilled' ? v.value : Object.assign({}, {status: v.reason}) )
            res.send(messages)
        })
    }
}

module.exports = new MessageController();

