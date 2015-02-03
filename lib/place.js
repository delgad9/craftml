var debug = require('debug')('craft.place')

module.exports = Place

var _ = require('lodash'),
    Scope = require('./scope'),
    Element = require('./element')

function Place() {
    this.contents = []
    this.type = 'Place'
}

Place.prototype = new Element()
Place.prototype.constructor = Place

Place.prototype.render = function(scope) {
	debug('rendering %s:', this.type)
    scope = scope || new Scope()
    var contents = scope.contents
	return this.renderContents(contents, scope)
}

