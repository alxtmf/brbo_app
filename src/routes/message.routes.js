const express = require("express")
const MessageController = require("../controllers/message.controller")
const router = express.Router()

router.route('/')
    .post(MessageController.createMessage)

module.exports = router
