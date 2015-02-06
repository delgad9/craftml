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

Place.prototype.resolveChildren = function(scope){
    return scope.children
}

Place.prototype.merge = function(selfSolid, childrenSolids){        
    return childrenSolids
}