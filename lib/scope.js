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


var select = require('./render/select')
Scope.prototype.select = function(){
    console.log('[scope]', this.element.attribs['select'])
    var selector = this.element.attribs['select']
    var selected = select(this.solids, selector)
    // console.log(selected)
    var top = this.solids[0]
    // console.log('top', JSON.stringify(top.layout))
    _.forEach(selected, function(s){
        s.convertCoordinateTo(top)
        // console.log('s.layout', JSON.stringify(s.layout))
    })
    return selected//console.log(selected)
}
