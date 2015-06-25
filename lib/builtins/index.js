var parse = require('../parse'),
    _ = require('lodash'),
    Promise = require("bluebird")

var _primitives = require('./primitives')
var _operations = require('./operations')

var xmls = _.merge(_primitives, _operations)

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
