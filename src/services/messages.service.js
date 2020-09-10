const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')

const endpoint = `http://localhost:${process.env.PORT}/graphql`
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

    async deleteMessage(message){
        try {
            if(message.uuid) {
                //delete mutation
                const data = await graphQLClient.request(gql`
                            mutation {
                            }
                    `
                )
                return message
            } else {
                return false
            }
        } catch(e){
            logger.info(`deleteMessage(${message}) - ` + e)
            return false
        }
    }

    async findEventType(message){
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
            logger.info(`findEventType(${message}) - ` + e)
            return false
        }
    }
}

module.exports = new MessagesService();
