var express = require('express')
var app = express()
var path = require('path')
var fs = require('fs')



var glob = require("glob")


app.set('view engine', 'jade');
app.set('views', __dirname + '/views')

// set where the static contents are (e.g., css, js)
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {

    var dir = 'build/preview'
    // glob(dir + '/*.stl', function(er, files) {

    var files = JSON.parse(fs.readFileSync(dir + '/stls.json', 'utf8'))

    var names = files.map(function(file) {
        return path.basename(file)
    })    

    res.render('viewer.jade', {
        names: names
    })

    // })
})

module.exports = app