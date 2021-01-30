const uuid = require('uuid');
const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')
const { HOST, PORT } = process.env
const endpoint = `http://${HOST || 'localhost'}:${PORT || 3000}/graphql`
const graphQLClient = new GraphQLClient(endpoint )

const MessageService = require('../services/messages.service')
const IncomRequestService = require('../services/incomRequest.service')

class RequestController {

    async getRequest(req, res) {
        if (!req.body || !req.body.target_system_code) return res.sendStatus(400);

        const targetSystemCode = req.body.target_system_code
        const eventTypeCode = req.body.event_type_code || null

        try {
            const eventType = await MessageService.findEventTypeByCodeAndType(eventTypeCode)

            const data = await IncomRequestService.findIncomRequestByTargetSystemAndEventType(
                targetSystemCode,
                eventType[0].uuid
            )

            if(data){
                res.send(data)
            } else {
                res.sendStatus(404)
            }

        } catch(e){
            logger.error('getRequest: ' + e)
            res.sendStatus(500)
        }
    }
}

module.exports = new RequestController();
