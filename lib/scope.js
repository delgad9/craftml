module.exports = Scope

var _ = require('lodash')

function Scope() {
    this.elements = []
    this.parameters = {}
}

Scope.prototype.addElement = function(element){
	this.elements.push(element)
}

Scope.prototype.getElementByName = function(name){
	return _.find(this.elements, {name: name})
}

Scope.prototype.clone = function(){
    var copy = new Scope()
     _.extend(copy, this)
    copy.parameters = _.clone(this.parameters)
    return copy    
}