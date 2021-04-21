const {logger } = require("../log");
const {GraphQLClient, gql} = require('graphql-request')

const endpoint = `http://localhost:${process.env.PORT}/graphql`
const graphQLClient = new GraphQLClient(endpoint)

class BotService {

    async findAll(){
        try {
            let data = await graphQLClient.request(gql`
                {
                    allClsBots(condition: {isDeleted: false}) {
                        nodes {
                            uuid
                            code
                            clsMessengerByIdMessenger {
                                uuid
                                code
                            }
                            name
                            settings
                            isDeleted
                        }
                    }
                }
            `)
            return data.allClsBots.nodes
        } catch (e) {
            logger.error(`[BotsService.findAll()]: ` + e)
            return null
        }
    }

    async findBot(botToken){
        try {
            const bots = await this.findAll()
            if(bots){
                const bot = bots.filter(b => {
                    const settings = JSON.parse(b.settings)
                    return settings.accessToken == botToken
                })
                if(bot.length > 0){
                    return bot[0]
                }
            }
            return null
        } catch (e) {
            logger.error(`[BotsService.findBot(${botToken})]: ` + e)
            return null
        }
    }

    async getConfigChannels(){
        try {
            let data = await this.findAll()
            let channels = {}
            data.forEach((bot, idx) => {
                channels[bot.code] = JSON.parse(bot.settings)
                logger.info(bot.code)
            })
            return  channels
        } catch (e) {
            logger.error(`BotsService.getConfigChannels() - ` + e)
            return null
        }
    }
}

module.exports = new BotService();
