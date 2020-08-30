require('dotenv').config()
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const postgraphile = require('./postgraphile')
const { logger }= require('./log')
const messageRouter = require("./routes/messageRouter")

const app = express()

const { PORT } = process.env

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(postgraphile)
app.use("/message", messageRouter)

app.use(function (req, res, next) {
    res.status(404).send("Not Found")
});

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`))
