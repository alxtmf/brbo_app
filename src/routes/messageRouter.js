const express = require("express")
const msgController = require("../controllers/msgController")
const messageRouter = express.Router()

messageRouter.post("/send", msgController.sendMessage)

module.exports = messageRouter
