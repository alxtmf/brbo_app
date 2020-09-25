require('dotenv').config()
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const postgraphile = require('./postgraphile')
const { logger }= require('./log')
const routes = require('./routes/index')
const scheduler = require('./schedules/scheduler')
const app = express()

const { PORT, NODE_ENV } = process.env

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(postgraphile)
app.use("/api", routes)

app.use(function (req, res, next) {
    res.status(404).send("Not Found")
});

scheduler.task.start()

app.listen(PORT, () => {
    const msg = `Server running on ${NODE_ENV} mode on port ${PORT}`
    logger.info(msg)
    console.log(msg)
})
