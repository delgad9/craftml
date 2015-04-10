var express = require('express')
var app = express()
var path = require('path')
var fs = require('fs')

app.set('view engine', 'jade');
app.set('views', __dirname + '/views')

// set where the static contents are (e.g., css, js)
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('viewer.jade', {
        contents: '',
        port: app.port
    })
})

app.get('/gist', function(req, res) {
    res.render('gist.jade', {
        contents: '',
        port: app.port
    })
})

app.get('/status', function(req, res) {
    res.render('viewer.jade')
})


module.exports = app