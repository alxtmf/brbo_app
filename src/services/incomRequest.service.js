const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')

const endpoint = `http://localhost:${process.env.PORT}/graphql`
const graphQLClient = new GraphQLClient(endpoint)

class IncomRequestService{
    async findIncomRequest(idIncomRequest) {
        try {
            const data = await graphQLClient.request(gql`
                {
                    allRegIncomRequests(condition: {uuid: "${idIncomRequest}", status: 1}) {
                        nodes {
                            uuid
                        }
                    }
                }
            `)
            /*
            {
              "data": {
                "allRegIncomRequests": {
                  "nodes": []
                }
              }
            }
            */
            return data.allRegIncomRequests.nodes.length
        } catch (e) {
            logger.info(`findIncomRequest(${idIncomRequest}) not found`)
            return false
        }
    }

    async findIncomRequestByTargetSystemAndEventType(targetSystemCode, idEventType){
        try {
            const idTargetSystem = await graphQLClient.request(gql`
                {
                    allClsTargetSystems(condition: {code: "${targetSystemCode}", isDeleted: false}) {
                        nodes {
                            uuid
                        }
                    }
                }
                `
            )

            const data = await graphQLClient.request(gql`
                {
                    allRegIncomRequests(condition: {idTargetSystem: "${idTargetSystem.allClsTargetSystems.nodes[0].uuid}", idEventType: "${idEventType}", status: 0}) {
                        nodes {
                            dateCreate
                            idBot
                            idEventType
                            idMessenger
                            idUser
                            status
                            uuid
                        }
                    }
                }
            `)
            return data.allRegIncomRequests.nodes
        } catch (e) {
            logger.info(`findIncomRequestByTargetSystemAndEventType return not found`)
            return false
        }
    }

    async saveIncomRequest(statusIncomRequest, idIncomRequest) {
        try {
            if (await this.findIncomRequest(idIncomRequest)) {
                const data = await graphQLClient.request(gql`
                            mutation {
                                __typename
                                updateRegIncomRequestByUuid(input: {regIncomRequestPatch: {status: ${statusIncomRequest}}, uuid: "${idIncomRequest}"}) {
                                    clientMutationId
                                }
                            }
                    `
                )
                return Promise.resolve({error: '', data: data})
            } else {
                throw "not found incomRequest"
            }
        } catch (e) {
            return Promise.reject({error: e, data: null})
        }
    }

}

module.exports = new IncomRequestService();
