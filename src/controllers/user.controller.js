const {logger } = require("../log");

const usersService = require('../services/users.service')
const targetSystemService = require('../services/targetSystem.service')

class UserController {

    async createOrUpdate(req, res) {
        if (!req.body) return res.sendStatus(400);

        const users = req.body.users

        logger.info(`received array of users. length: ${users.length}`)

        const promises = users.map(async (user) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const targetSystem = await targetSystemService.findTargetSystemByCode(user.target_system_code)
                    if(targetSystem.length == 0){
                        user.status = `target system ${user.target_system_code} not found`
                    } else {
                        const targetSystemUser = await usersService.findRegTargetSystemUser(targetSystem[0].uuid, user.login)
                        if(targetSystemUser.length > 0){
                            //update
                            const result = await usersService.updateRegTargetSystemUser(targetSystemUser[0].uuid, user)
                            user.status = result ? 'updated' : 'error update'
                        } else {
                            //insert
                            const result = await usersService.createRegTargetSystemUser(targetSystem[0].uuid, user)
                            user.status = result ? 'created' : 'error create'
                        }
                    }

                    return resolve(user)
                } catch (e) {
                    logger.error(`[userController.createOrUpdate]: ${e}`)
                    return reject(`[createOrUpdate.createOrUpdate]: ${e}`)
                }
            })
        })

        Promise.allSettled(promises).then((result) => {
            const users = result.map(v => v.status == 'fulfilled' ? v.value : Object.assign({}, {status: v.reason}) )
            res.send(users)
        })
    }
}

module.exports = new UserController();
