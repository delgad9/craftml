var debug = require('debug')('craft.place')

module.exports = Place

var _ = require('lodash'),
    Scope = require('./scope'),
    Element = require('./element')

function Place() {
    Element.apply(this)
}

Place.prototype = new Element()
Place.prototype.constructor = Place

Place.prototype.render = function(scope) {
	debug('rendering %s:', this.class)
    scope = scope || new Scope()
    var children = scope.children
	return this.renderChildren(children, scope)
}

