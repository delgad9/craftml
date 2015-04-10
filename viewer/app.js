var express = require('express')
var app = express()
var path = require('path')
var fs = require('fs')

app.set('view engine', 'jade');
app.set('views', __dirname + '/views')

// set where the static contents are (e.g., css, js)
app.use(express.static(__dirname + '/public'));

//function file() {
//    return function(req, res, next) {
//        req.file = {contents: '<craftml><row><cube></cube><cube></cube></row></craftml>'}
//        next()
//    }
//}
//app.use(file())

app.get('/', function(req, res) {
    // if (req.query.file){
    //     var localPath = req.query.file
    //     fs.readFile(localPath, 'utf8', function(err, contents){
    //         res.render('viewer.jade', {
    //             contents: contents
    //         })
    //     })
    // }
    res.render('viewer.jade', {
        contents: '',
        port: app.port
    })
})

app.get('/status', function(req, res) {
    res.render('viewer.jade')
})


module.exports = app