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



var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))

// load gist
// https://gist.githubusercontent.com/
function loadGist(loc) {    
    var url = 'https://gist.githubusercontent.com/' + loc + '/raw/index.xml'
    return request
        .getAsync({
            url: url
        })
        .spread(function(response, body) {
            return {
                basePath: 'https://gist.githubusercontent.com/' + loc + '/raw/',
                contents: body
                // src: src,
                // url: 'http://gist.github.com/' + m[1]
            }
        })
}

app.get('/gist/:username/:gistid', function(req, res) {
    var loc = req.params.username + '/' + req.params.gistid
    loadGist(loc)
        .then(function(o){
            res.render('gist.jade', {
                contents: o.contents,
                basePath: o.basePath,
                port: app.port
            })        
        })
})

app.get('/status', function(req, res) {
    res.render('viewer.jade')
})


module.exports = app