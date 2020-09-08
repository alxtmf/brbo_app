const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')
const endpoint = `http://localhost:${process.env.PORT}/graphql`
const graphQLClient = new GraphQLClient(endpoint )//, {
//     headers: {
//         authorization: 'Bearer MY_TOKEN',
//     },
// })

async function deleteMessage(message){
    try {
        //delete mutation
        const data = await graphQLClient.request(gql`
                    mutation {
                    }
            `
        )
        return message
    } catch(e){
        return e
    }
}

module.exports.delMessage = function() {
    //TODO del messages from reg_sent_message

}
