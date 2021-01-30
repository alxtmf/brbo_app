const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')

const { HOST, PORT } = process.env
const endpoint = `http://${HOST || 'localhost'}:${PORT || 3000}/graphql`
const graphQLClient = new GraphQLClient(endpoint)

class RequestsService {


}

module.exports = new RequestsService()
