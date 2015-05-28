module.exports = Scope

var _ = require('lodash')

function Scope() {
    this.elements = []
    this.parameters = {}
    this.crafts = {}
    this.parts = {}
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
    // copy.crafts = _.clone(this.craft)
    copy.parameters = _.clone(this.parameters)
    copy.isRoot = false
    return copy
}

var addWith = require('with')
// eval an expression within the scope parameters
Scope.prototype.eval = function(expr){
    var o = {}
    var withExpr = addWith('this.parameters', 'o.v = ' + expr)
    eval(withExpr)
    return o.v
}
