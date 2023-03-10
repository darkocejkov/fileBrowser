const express = require('express')
const bodyParser = require('body-parser');

const mime = require('mime-types')

const fs = require('fs')
const path = require('path')

const app = express()
const port = 3001

const MAX_RECURSE_DEPTH = 2

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use(express.static('X:\\'))

app.get('/', (req, res, next) => {
    res.send('root')
})

app.get('/api', (req, res) => {
    res.send({msg: 'hi!'})
})

app.get('/api/test/:id', (req, res, next) => {
    res.status(200).send('received id ' + req.params.id)
})

app.post('/videos', (req, res, next) => {
    fs.readdir(req.body.absolutePath, (error, files) => {
        if (error){
            console.log(error)
            res.status(500).json(error)
        }

        let videos = []

        if(files){
            for(let file of files){

                let type = mime.lookup(file)

                if(type && type.split('/')[0] === 'video'){
                    videos.push(file)
                }
            }
        }

        res.status(200).json({videos})
    })
})

app.post('/images', (req, res, next) => {
    fs.readdir(req.body.absolutePath, (error, files) => {
        if (error){
            console.log(error)
            res.status(500).json(error)
        }

        let images = []

        if(files){
            for(let file of files){

                let type = mime.lookup(file)

                if(type && type.split('/')[0] === 'image'){
                    images.push(file)
                }
            }
        }

        res.status(200).json({images})
    })
})
app.post('/files', (req, res, next) => {

    fs.readdir(req.body.absolutePath, (error, files) => {
        if (error){
            console.log(error)
            res.status(500).json(error)
        }

        let images = []
        let videos = []
        let dirs = []

        let types = []

        if(files){
            for(let file of files){

                let type = mime.lookup(file)

                if(type){

                    let found = types.find(x => x.type === type)

                    if(found){
                        found.count += 1
                    }else{
                        types.push({type, count: 1})
                    }

                    if(type.split('/')[0] === 'image') {
                        images.push(file)
                    }else if(type.split('/')[0] === 'video'){
                        videos.push(file)
                    }
                }
            }
        }

        res.status(200).json({images, videos, dirs})
    })

})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})