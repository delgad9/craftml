var debug = require('debug')('craft.place')

module.exports = Place

var _ = require('lodash'),
    Solid = require('./solid'),
    CraftRef = require('./craftref'),
    Craft = require('./craft'),
    Place = require('./place'),
    Block = require('./block')

function Place() {
    this.contents = []
    this.type = 'Place'
}

Place.prototype = new Block()
Place.prototype.constructor = Place

Place.prototype.render = function(scope) {
    scope = scope || {}
    var contents = scope.contents
	return this.renderContents(contents, scope)    
}

