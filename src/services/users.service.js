const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')

const endpoint = `http://localhost:${process.env.PORT}/graphql`
const graphQLClient = new GraphQLClient(endpoint)

class UsersService {

    async findAll(outerId){
        try {
            let data = await graphQLClient.request(gql`
                {
                    allRegMessengerUsers(condition: {outerId: "${outerId}", isDeleted: false}) {
                        nodes {
                            settings
                            clsMessengerByIdMessenger {
                                name
                                clsBotsByIdMessenger(condition: {isDeleted: false}) {
                                    nodes {
                                        uuid
                                        code
                                        name
                                    }
                                }
                            }
                            clsUserByIdUser {
                                uuid
                                code
                                identificator
                            }
                        }
                    }
                }
            `)
            return data
        } catch (e) {
            logger.error(`findAll(${outerId}) - ` + e)
            return false
        }
    }
}

module.exports = new UsersService();
