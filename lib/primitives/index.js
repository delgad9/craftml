var parse = require('../parse'),
    fs = require('fs')

var primitives = {}
var names = ['cube', 'sphere', 'cylinder', 'line']

names.forEach(function(name) {

    var src = __dirname + '/' + name + ".xml"
    var xml = fs.readFileSync(src,'utf8')
    primitives[name] = parse(xml)

})

module.exports = primitives