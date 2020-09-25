const express = require('express')
const messageRouter = require('./messages.routes')
const router = express.Router()

router.use('/messages', messageRouter)

module.exports = router
