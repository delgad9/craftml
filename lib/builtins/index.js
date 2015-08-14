var parse = require('../parse'),
    _ = require('lodash'),
    Promise = require("bluebird")

var _primitives = require('./primitives')
var xmls = _primitives

var primitives = {}
var promise = Promise
    .map(_.pairs(xmls), function(d) {

        var name = d[0]
        var xml = d[1]

        let context = {
            path: name,
            contents: xml
        }
        // console.log(context)
        return parse(context)
            .then( parsed => {
                primitives[name] = parsed
            })
    })
    .then(function() {
        return primitives
    })

module.exports = promise
