const express = require('express')
const cors = require("cors");

const app = express()
const port = 3001

app.get('/', (req, res, next) => {
    res.send('root')
})

app.get('/api', (req, res) => {
    res.send({msg: 'hi!'})
})

app.get('/api/test/:id', (req, res, next) => {
    res.status(200).send('received id ' + req.params.id)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})