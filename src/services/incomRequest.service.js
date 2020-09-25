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
                throw "not found incom"
            }
        } catch (e) {
            return Promise.reject({error: e, data: null})
        }
    }

}

module.exports = new IncomRequestService();
