var parse = require('../parse'),
    fs = require('fs'),
    Promise = require("bluebird")

var primitives = {}
var names = ['cube', 'sphere', 'cylinder', 'line', 'row', 'stack', 'column', 'text', 'lineup', 'align', 'scale']

var fs = Promise.promisifyAll(require('fs'))

var listToLoad = names.map(function(name) {
    var src = __dirname + '/' + name + ".xml"
    return {
        name: name,
        src: src
    }
})

var promise = Promise.map(listToLoad, function(d) {

        return fs.readFileAsync(d.src, 'utf8')
            .then(function(xml) {
                return parse(xml)
            })
            .then(function(parsed) {
                primitives[d.name] = parsed
            })

    })
    .then(function() {
        return primitives
    })

module.exports = promise