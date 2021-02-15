const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')

const endpoint = `http://localhost:${process.env.PORT}/graphql`
const graphQLClient = new GraphQLClient(endpoint)

class BotsService {

    async findAll(){
        try {
            let data = await graphQLClient.request(gql`
                {
                    allClsBots(condition: {isDeleted: false}) {
                        nodes {
                            uuid
                            code
                            clsMessengerByIdMessenger {
                                code
                            }
                            name
                            settings
                            isDeleted
                        }
                    }
                }
            `)
            return Promise.resolve(data.allClsBots.nodes)
        } catch (e) {
            logger.error(`BotsService.findAll() - ` + e)
            return Promise.reject()
        }
    }
}

module.exports = new BotsService();
