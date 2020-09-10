const express = require("express")
const MessagesController = require("../controllers/messages.controller")
const router = express.Router()

router.route('/')
    .post(MessagesController.sendMessage)

module.exports = router
