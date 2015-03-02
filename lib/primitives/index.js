var parse = require('../parse'),
    fs = require('fs'),
    Promise = require("bluebird")

var primitives = {}
var names = ['cube', 'sphere', 'cylinder', 'line', 'row', 'stack', 'column', 'text', 'lineup', 'align']

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
        .then(function(parsed){
            primitives[d.name] = parsed
        })

})
.then(function(){
    return primitives
})


// .map(function(xml) {

//     return parse(xml)
// }) xml = fs.readFileSync(src, 'utf8') var t = parse(xml)

// primitives[name] = t
// })

module.exports = promise