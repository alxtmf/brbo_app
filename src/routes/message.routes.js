const express = require("express")
const MessageController = require("../controllers/message.controller")
const router = express.Router()

router.route('/')
    .post(MessageController.sendMessage)

module.exports = router
