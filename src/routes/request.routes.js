const express = require("express")
const RequestController = require("../controllers/request.controller")
const router = express.Router()

router.route('/')
    .post(RequestController.getRequest)

module.exports = router
