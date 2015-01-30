module.exports = Scope

var _ = require('lodash')

function Scope() {
    // this.$ = $
    this.elements = []
}

Scope.prototype.addElement = function(element){
	this.elements.push(element)
}

Scope.prototype.getElementByName = function(name){
	console.log(this.element)
	return _.find(this.elements, {name: name})
}