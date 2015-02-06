module.exports = CraftRef

var Element = require('./element'),
    _ = require('lodash')

function CraftRef(ref) {
    Element.apply(this)
    this.ref = ref
}

CraftRef.prototype = new Element()
CraftRef.prototype.constructor = CraftRef

CraftRef.prototype.render = function(scope) {
    this.emit('render', this, scope)

    var craft = scope[this.ref]
    if (craft === undefined)
        throw 'craft ' + this.ref + ' can not be resolved'
    // TODO: handle craft ref not resolved error

    scope.children = this.children
        
    var solid = craft.render(scope)
    this.rendered = solid

    
    solid.layout.location.x = Number(this.attribs['x']) || 0
    solid.layout.location.y = Number(this.attribs['y']) || 0
    solid.layout.location.z = Number(this.attribs['z']) || 0

    return solid
}