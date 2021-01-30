const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')

const { HOST, PORT } = process.env
const endpoint = `http://${HOST || 'localhost'}:${PORT || 3000}/graphql`
const graphQLClient = new GraphQLClient(endpoint)

class MessagesService {

    createMessage(message){
        return new Promise(async (res, rej) => {
            await graphQLClient.request(gql`
                        mutation {
                            __typename
                            createRegSentMessage(input: {regSentMessage: {
                                idEventType: "${message.idEventType}",
                                idTargetSystem: "${message.idTargetSystem}",
                                text: "${message.text}",
                                idUser: "${message.idUser}",
                                status: 0,
                                dateCreate: "${new Date().toISOString()}"}}) {
                                clientMutationId
                            }
                        }
                `
            ).then(value =>
            //TODO надо чтоб из БД вовращалась полная запись и сделать return data
                {return res(message)}
            )
            .catch(reason => {
                logger.info(`createMessage(${message}) - ` + reason)
                return false
            })
        })
    }

    // updateMessage(){  }

    async deleteNoSentMessages(params){
        try {
            if(params) {
                //delete mutation
                const data = await graphQLClient.request(gql`
                            mutation {
                                __typename
                                deleteNoSentMessages(input: { threshold: ${params.threshold} }){
                                    bigInt
                                }
                            }
                    `
                )
                return data.deleteNoSentMessages.bigInt
            } else {
                return 0
            }
        } catch(e){
            logger.info(`deleteNoSentMessage(${params}) - ` + e)
            return 0
        }
    }

    async deleteSentMessages(params){
        try {
            if(params) {
                //delete mutation
                const data = await graphQLClient.request(gql`
                            mutation {
                                __typename
                                deleteSentMessages(input: { threshold: ${params.threshold} }){
                                    bigInt
                                }
                            }
                    `
                )
                return data.deleteSentMessages.bigInt
            } else {
                return 0
            }
        } catch(e){
            logger.info(`deleteSentMessage(${params}) - ` + e)
            return 0
        }
    }

    async findEventTypeByMessage(message){
        /*
        {
          "data": {
            "allClsEventTypes": {
              "nodes": [
                {
                  "idTargetSystem": "c181923a-e523-11ea-ba17-7085c2f42519",
                  "clsTargetSystemByIdTargetSystem": {
                    "regTargetSystemUsersByIdTargetSystem": {
                      "edges": [
                        {
                          "node": {
                            "idUser": "c961d10f-e523-11ea-ba17-7085c2f42519"
                          }
                        }
                      ]
                    }
                  },
                  "uuid": "c181923e-e523-11ea-ba17-7085c2f42519"
                }
              ]
            }
          }
        }
        */

        try {
            let data = await graphQLClient.request(gql`
                {
                    allClsEventTypes(condition: {code: "${message.event_type}", isDeleted: false}) {
                        nodes {
                            uuid
                            idTargetSystem
                            clsTargetSystemByIdTargetSystem {
                                regTargetSystemUsersByIdTargetSystem(condition: {outerId: "${message.user_id}", isDeleted: false}) {
                                    edges {
                                        node {
                                            idUser
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `)
            return data
        } catch (e) {
            logger.error(`findEventType(${message}) - ` + e)
            return false
        }
    }

    async findEventTypeByType(idEventType, typ){
        try {
            let data = await graphQLClient.request(gql`
                {
                    allClsEventTypes(condition: {code: "${idEventType}", type: ${typ}, isDeleted: false}) {
                        nodes {
                            uuid
                        }
                    }
                }
            `)
            return data
        } catch (e) {
            logger.info(`findEventType(${dEventType}, ${type}) - ` + e)
            return false
        }
    }

    async getMessagesToSend(statuses){
        try {
            let data = await graphQLClient.request(gql`
                {
                    allRegSentMessages(filter: {status: {in: [${statuses}]}}) {
                        nodes {
                            uuid
                            idUser
                            text
                            status
                            attachedFile
                            attachedFileType
                            attachedFileSize
                            attachedFileHash
                            idIncomRequest
                            settings
                        }
                    }                
                }
            `)
            return data
        } catch (e) {
            logger.info(`` + e)
            return false
        }
    }

    async getMessengerUserMessageRoutes(idUser){
        try {
            let data = await graphQLClient.request(gql`
                {
                    allVMessengerUserMessageRoutes(condition: {idUser: "${idUser}"}) {
                        nodes {                             
                                idBot
                                idUser
                                idMessenger
                                idEventType
                                idTargetSystem
                                idParentEventType
                                outerId
                                userSettings
                                botName
                                botSettings
                                messengerCode
                        }
                    }
                }
            `)
            return data
        } catch (e) {
            logger.info(`` + e)
            return false
        }
    }

    async getUserKeyboardData(idUser, idBot, idParentEventTypeCode){
        try {
            const idEvent = await this.findEventTypeByType(idParentEventTypeCode, 1)

            //const gquery = idEvent.allClsEventTypes.nodes.length == 0 ?
            const gquery = (idParentEventTypeCode == null ?
                gql`
                {
                    allVMessengerUserMessageRoutes(
                        condition: {idBot: "${idBot}", idUser: "${idUser}", typeEvent: 1 },
                        filter: {idParentEventType: {isNull: true}}
                    ) {
                        nodes {
                            idEventType
                        }
                    }
                }
            `
            :
            gql`
                {
                    allVMessengerUserMessageRoutes(
                        condition: {idBot: "${idBot}", idUser: "${idUser}", idParentEventType: "${idEvent.allClsEventTypes.nodes[0].uuid}", typeEvent: 1 }
                    ) {
                        nodes {
                            idEventType
                        }
                    }
                }
            `
            )

            let data = await graphQLClient.request(gquery);

            if(data.allVMessengerUserMessageRoutes.nodes[0]) {
                return graphQLClient.request(gql`
                    {
                        allClsEventTypes(condition: {uuid: "${data.allVMessengerUserMessageRoutes.nodes[0].idEventType}"}) {
                            nodes {
                                name
                                code
                            }
                        }
                    }
                `);
            } else {
                return null
            }
        } catch (e) {
            logger.info(`` + e)
            return null
        }
    }

    async setMessageStatus(params){
        try {
            if(params) {
                //update mutation
                const data = await graphQLClient.request(gql`
                            mutation {
                                __typename
                                updateRegSentMessageByUuid(input: {
                                    regSentMessagePatch: { status: ${params.status}},
                                    uuid: "${params.message.uuid}"}) {
                                    clientMutationId
                                }
                            }

                    `
                )
                return data.error || 1
            } else {
                return 0
            }
        } catch(e){
            logger.info(`setMessageStatus(${params}) - ` + e)
            return 0
        }
    }
}

module.exports = new MessagesService();
