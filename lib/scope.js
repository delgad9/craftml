module.exports = Scope

var _ = require('lodash')  
    
function Scope() {
    this.elements = []
    this.parameters = {}
    this.crafts = {}
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