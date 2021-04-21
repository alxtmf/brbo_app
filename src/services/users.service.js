const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')
const BotService = require('./bot.service')

const endpoint = `http://localhost:${process.env.PORT}/graphql`
const graphQLClient = new GraphQLClient(endpoint)

class UsersService {

    async findAll(outerId){
        try {
            const data = await graphQLClient.request(gql`
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
                                        settings
                                        idMessenger
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
            return data.allRegMessengerUsers.nodes
        } catch (e) {
            logger.error(`UsersService.findAll(${outerId}) - ` + e)
            return false
        }
    }


    async findRegTargetSystemUser(targetSystemId, login){
        try {
            const data = await graphQLClient.request(gql`
                {
                    allRegTargetSystemUsers(condition: {idTargetSystem: "${targetSystemId}", login: "${login}", isDeleted: false}) {
                        nodes {
                            uuid
                        }
                    }
                }
            `)
            return data.allRegTargetSystemUsers.nodes
        } catch (e) {
            logger.error(`UsersService.findRegTargetSystemUser(${targetSystemId}, ${login}) - ` + e)
            return false
        }
    }

    async createRegTargetSystemUser(targetSystemId, user){
        try {
            const data = await graphQLClient.request(gql`
                mutation {
                    __typename
                    createRegTargetSystemUser(input: {
                        regTargetSystemUser: {
                            idTargetSystem: "${targetSystemId}",
                            login: "${user.login}",
                            outerId: "${user.login}",
                            firstname: "${user.firstname || ''}",
                            lastname: "${user.lastname || ''}",
                            patronymic: "${user.patronymic || ''}",
                            email: "${user.email || ''}"
                            isDeleted: false
                        }
                    }) {
                        clientMutationId
                    }
                }
            `)
            return data.error || 1
        } catch (e) {
            logger.error(`UsersService.createRegTargetSystemUser(${targetSystemId}, ${user.login}) - ` + e)
            return 0
        }
    }

    async updateRegTargetSystemUser(targetSystemUserId, user){
        try {
            let data = await graphQLClient.request(gql`
                mutation {
                    __typename
                    updateRegTargetSystemUserByUuid(input: {
                        regTargetSystemUserPatch: {
                            firstname: "${user.firstname || ''}",
                            lastname: "${user.lastname || ''}",
                            patronymic: "${user.patronymic || ''}",
                            email: "${user.email || ''}",
                            isDeleted: ${user.is_deleted || false}
                        },
                        uuid: "${targetSystemUserId}" 
                    }) {
                        clientMutationId
                    }
                }
            `)
            return data.error || 1
        } catch (e) {
            logger.error(`UsersService.updateRegTargetSystemUser(${targetSystemUserId}, ${user.login}) - ` + e)
            return 0
        }
    }

    async checkAuthUser(userId, botToken){
        try {
            const data = await this.findAll(userId)
            if (userId && data.length) {
                //find bot by accessToken
                const bot = data[0].clsMessengerByIdMessenger.clsBotsByIdMessenger.nodes
                    .filter(item => {
                        const settings = JSON.parse(item.settings)
                        return settings.accessToken == botToken
                    })
                if(bot) {
                    return {clsUser: data[0].clsUserByIdUser, bot: bot[0]}
                } else {
                    return null
                }
            } else {
                // save user.id in
            }
        } catch(e){
            logger.error(`[checkAuthUser]: ${e}`)
        }
        return null
    }

    async activateUser(user, botToken, ident){
        try {
            const data = await graphQLClient.request(gql`
                {
                    allClsUsers(condition: {identificator: "${ident}", isDeleted: false}) {
                        nodes {
                            uuid
                            code
                            identificator
                        }
                    }
                }
            `)

            if(data && data.allClsUsers.nodes.length){
                // write to regMessengerUser
                const bot = await BotService.findBot(botToken)

                const regUser = await graphQLClient.request(gql`
                    mutation {
                        __typename
                        createRegMessengerUser(input: {
                            regMessengerUser: {
                                outerId: "${user.id}",
                                idMessenger: "${bot.clsMessengerByIdMessenger.uuid}",
                                idUser: "${data.allClsUsers.nodes[0].uuid}",
                                isDeleted: false
                            }
                        }) {
                            clientMutationId
                        }
                    }
                `)
                return regUser || null
            }
            return null

        } catch(e){
            logger.error(`[activateUser]: ${e}`)
            return null
        }
    }
}

module.exports = new UsersService();
