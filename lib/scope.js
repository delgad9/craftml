module.exports = Scope

var _ = require('lodash'),
    parse = require('./parse'),
    fs = require('fs')

function Scope() {
    this.elements = []
    this.parameters = {}

    // load primitives
    var xml = fs.readFileSync(__dirname + '/primitives/cube.xml','utf8')
    this.cube = parse(xml)
}

Scope.prototype.addElement = function(element) {
    this.elements.push(element)
}

Scope.prototype.getElementByName = function(name) {
    return _.find(this.elements, {
        name: name
    })
}

Scope.prototype.clone = function() {
    var copy = new Scope()
    _.extend(copy, this)
    copy.parameters = _.clone(this.parameters)
    return copy
}