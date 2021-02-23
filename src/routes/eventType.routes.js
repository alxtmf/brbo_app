const express = require("express")
const EventTypeController = require("../controllers/eventType.controller")
const router = express.Router()

router.route('/')
    .post(EventTypeController.createEventType)

module.exports = router
