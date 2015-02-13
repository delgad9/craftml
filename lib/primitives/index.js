var parse = require('../parse'),
    fs = require('fs')

var primitives = {}
var names = ['cube', 'sphere', 'cylinder', 'line', 'row', 'stack', 'column', 'text', 'lineup', 'align']

names.forEach(function(name) {

    var src = __dirname + '/' + name + ".xml"
    var xml = fs.readFileSync(src,'utf8')
    var t = parse(xml)

    primitives[name] = t
})

module.exports = primitives