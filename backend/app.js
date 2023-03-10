const express = require('express')
const bodyParser = require('body-parser');

const mime = require('mime-types')

const fs = require('fs')
const path = require('path')

const app = express()
const port = 3001

const MAX_RECURSE_DEPTH = 2

require('dotenv').config();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use(express.static(process.env.SERVE_STATIC_PATH))

// create middleware function
app.use('/serve/path/*', (req, res, next) => {
    // req.url = path.basename(req.originalUrl);
    console.log(req.params)
    express.static(req.params['0'])(req, res, next);
})

const walk = function(dir, done) {
    var results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    results.push(file);
                    if (!--pending) done(null, results);
                }
            });
        });
    });
};

const walkDirectory = (dirPath) => {

    const items = fs.readdirSync(dirPath)

    if(items && items.length > 0){

        let subItems = []

        for(let item of items){
            let itemStats = fs.statSync(path.join(dirPath, item))

            if(itemStats.isFile()){
                subItems.push({
                    filename: item,
                    type: mime.lookup(item),
                })
            }else if(itemStats.isDirectory()){

                subItems.push({
                    filename: item,
                    type: 'directory',
                })

                walkDirectory(path.join(dirPath, item))
            }
        }

        return subItems
    }else{
        return null
    }
}

app.get('/manifest/*', (req, res, next) => {

    if(!req.params) res.send("No Directory")

    //  1. readDir to find all the files within the requested directory
    //  2. for each file, figure out what kind of file it is, or whether it is a directory

    let filePath = req.params[0]


    fs.lstat(filePath, (err, stats) => {

        if(stats.isDirectory()){

            walk(filePath, (err, files) => {
                res.status(200).json({files})
            })

            // fs.readdir(filePath, (error, files) => {
            //     if (error){
            //         console.log(error)
            //         res.status(500).json(error)
            //     }
            //
            //     let all = []
            //     let dirs = []
            //     let images = []
            //     let video = []
            //
            //     if(files){
            //         for(let file of files){
            //
            //             let fileStats = fs.statSync(path.join(filePath, file))
            //
            //             if(fileStats.isDirectory()){
            //                 all.push({
            //                     filename: file,
            //                     type: 'directory',
            //                     manifest: []
            //                 })
            //             }else {
            //                 let type = mime.lookup(file)
            //
            //                 all.push({
            //                     filename: file,
            //                     type,
            //                 })
            //             }
            //         }
            //     }
            //
            //     res.status(200).json({all})
            // })
        }else{
            let type = mime.lookup(filePath)

            res.status(200).json({
                filename: filePath,
                type
            })
        }

    })
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