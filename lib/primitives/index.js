var parse = require('../parse'),
    fs = require('fs'),
    _ = require('lodash'),
    Promise = require("bluebird")

if (fs.readFileSync) {
    // fs is available on server-side
    require = function(src) {
        return fs.readFileSync(__dirname + '/' + src, 'utf8')
    }
} // otherwise, browserify & partialify will take care of 'require'

var xmls = {
    cube: require('./cube.xml'),
    sphere: require('./sphere.xml'),
    cylinder: require('./cylinder.xml'),
    row: require('./row.xml'),
    column: require('./column.xml'),
    stack: require('./stack.xml'),
    text: require('./text.xml'),
    lineup: require('./lineup.xml'),
    scale: require('./scale.xml'),
    align: require('./align.xml'),
    repeat: require('./repeat.xml'),
    rotate: require('./rotate.xml'),
    crop: require('./crop.xml'),
    space: require('./space.xml'),
    fit: require('./fit.xml'),
}

var primitives = {}
var promise = Promise
    .map(_.pairs(xmls), function(d) {

        var name = d[0]
        var xml = d[1]

        return parse(xml)
            .then(function(parsed) {
                primitives[name] = parsed
            })

    })
    .then(function() {
        return primitives
    })

module.exports = promise