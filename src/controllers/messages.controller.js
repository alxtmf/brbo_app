const uuid = require('uuid');
const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')
const endpoint = `http://localhost:${process.env.PORT}/graphql`
const graphQLClient = new GraphQLClient(endpoint )//, {
//     headers: {
//         authorization: 'Bearer MY_TOKEN',
//     },
// })

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

class MessagesController {

/*
    async function saveMessage(message) {
        try {
            //TODO save attachments
            const data = await graphQLClient.request(gql`
                        mutation {
                            __typename
                            createRegSentMessage(input: {regSentMessage: {
                                idEventType: "${message.idEventType}",
                                idTargetSystem: "${message.idTargetSystem}",
                                uuid: "${uuid.v4()}",
                                text: "${message.text}",
                                idUser: "${message.idUser}",
                                status: 0,
                                dateCreate: "${new Date().toISOString()}"}}) {
                                clientMutationId
                            }
                        }
                `
            )
            return message
        } catch (e) {
            return e
        }
    }
*/

/*
    async function findIncomRequest(idIncomRequest) {
        const data = await graphQLClient.request(gql`
            {
                allRegIncomRequests(condition: {uuid: "${idIncomRequest}", status: 1}) {
                    nodes {
                        uuid
                    }
                }
            }
        `)
        /!*
        {
          "data": {
            "allRegIncomRequests": {
              "nodes": []
            }
          }
        }
        *!/
        return data.allRegIncomRequests.nodes.length
    }
*/

/*
    async function saveIncomRequest(idIncomRequest) {
        try {
            const isFindIncom = await findIncomRequest(idIncomRequest)

            if (isFindIncom) {
                const data = await graphQLClient.request(gql`
                            mutation {
                                __typename
                                updateRegIncomRequestByUuid(input: {regIncomRequestPatch: {status: 2}, uuid: "${idIncomRequest}"}) {
                                    clientMutationId
                                }
                            }
                    `
                )
                return Promise.resolve({error: '', data: data})
            } else {
                throw "not found incom"
            }
        } catch (e) {
            return Promise.reject({error: e, data: null})
        }
    }
*/

    sendMessage(req, res) {
        if (!req.body) return res.sendStatus(400);

        const messages = req.body.messages

        const promises = messages.map(async (message) => {
            try {
                let data = await MessageService.findEventType(message)
                data = false
                if (!data || data.allClsEventTypes.nodes[0].uuid == "" && data.allClsEventTypes.nodes[0].clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges.length == 0) {
                    throw message
                } else {
                    message.idEventType = data.allClsEventTypes.nodes[0].uuid
                    message.idTargetSystem = data.allClsEventTypes.nodes[0].idTargetSystem
                    message.idUser = data.allClsEventTypes.nodes[0].clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges[0].node.idUser

                    //if message.id_incom_request not null
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
                throw message
            }
        })

        Promise.allSettled(promises).then((result) => {
            res.send(result)
        })
    }

}

module.exports = new MessagesController();

