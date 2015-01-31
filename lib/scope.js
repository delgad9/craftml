module.exports = Scope

var _ = require('lodash')

function Scope() {
    this.elements = []
}

Scope.prototype.addElement = function(element){
	this.elements.push(element)
}

Scope.prototype.getElementByName = function(name){
	return _.find(this.elements, {name: name})
}