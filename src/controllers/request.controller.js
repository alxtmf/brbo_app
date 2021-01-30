const uuid = require('uuid');
const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')
const { HOST, PORT } = process.env
const endpoint = `http://${HOST || 'localhost'}:${PORT || 3000}/graphql`
const graphQLClient = new GraphQLClient(endpoint )

class RequestController {

    getRequest(req, res){
        if (!req.body || !req.body.target_system_code) return res.sendStatus(400);

        const targetSystemCode = req.body.target_system_code
        const eventTypeCode = req.body.event_type_code || null


    }
}

module.exports = new RequestController();
