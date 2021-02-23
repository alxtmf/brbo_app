const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')

const endpoint = `http://localhost:${process.env.PORT}/graphql`
const graphQLClient = new GraphQLClient(endpoint)

class TargetSystemService {

    async findTargetSystemByCode(targetSystemCode){
        try {
            let data = await graphQLClient.request(gql`
                {
                    allClsTargetSystems(condition: {code: "${targetSystemCode}"}) {
                        nodes {
                            uuid
                            code
                            name
                        }
                    }
                }
            `)
            return data.allClsTargetSystems.nodes
        } catch (e) {
            logger.error(`targetSystemService.findTargetSystemByCode - ` + e)
            return false
        }
    }
}

module.exports = new TargetSystemService()
