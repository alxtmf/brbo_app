const {logger} = require("../log");
const {GraphQLClient, gql} = require('graphql-request')
const endpoint = `http://localhost:${process.env.PORT}/graphql`

module.exports.sendMessage = function(request, response){
    if(!request.body) return response.sendStatus(400);

    const graphQLClient = new GraphQLClient(endpoint )//, {
//     headers: {
//         authorization: 'Bearer MY_TOKEN',
//     },
// })

    const messages = request.body.messages
    let results = []

    const promises = messages.map(async (message) => {
        try {
            console.log(`message:` + message);

            const data = await graphQLClient.request(gql`
                {
                    allClsEventTypes(condition: {code: "${message.event_type}", isDeleted: false}) {
                        nodes {
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
            console.log("result: " + JSON.stringify(data));

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

            if(data.allClsEventTypes.nodes.uuid == "" && data.allClsEventTypes.nodes.clsTargetSystemByIdTargetSystem.regTargetSystemUsersByIdTargetSystem.edges.length == 0){
                //results.push({message: message, result: "event_type not found"})
                return {message: message, result: "event_type not found"}
            } else{
                //results.push({message: message, result: "ok"})
                // graphql mutation
                return {message: message, result: "ok"}
            }
        }catch (e) {
            console.log(JSON.stringify(e))
            return {message: message, result: "error"}
        }
    })

    Promise.all(promises).then((result)=>{ response.send(result) })
};


