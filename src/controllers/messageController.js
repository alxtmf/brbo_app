const {logger} = require("../log");
const {GraphQLClient, gql} = require('graphql-request')
const endpoint = `http://localhost:${process.env.PORT}/graphql`

exports.sendMessage = function (request, response){

    async function main() {
        const graphQLClient = new GraphQLClient(endpoint )//, {
        //     headers: {
        //         authorization: 'Bearer MY_TOKEN',
        //     },
        // })

        const query = gql`
            {
                allClsEventTypes(condition: {code: "EVENT_1"}) {
                    nodes {
                        code
                        idTargetSystem
                        name
                        type
                    }
                }
            }
        `

        const data = await graphQLClient.request(query)
        console.log(JSON.stringify(data, undefined, 2))
        logger.log.info(JSON.stringify(data, undefined, 2))
        response.send(JSON.stringify(data, undefined, 2))
    }

    main().catch((error) => console.error(error))
};
