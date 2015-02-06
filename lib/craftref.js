module.exports = CraftRef

var Element = require('./element'),
    _ = require('lodash')

function CraftRef(ref) {
    this.contents = []
    this.ref = ref
    this.tag = 'CraftRef'
}

CraftRef.prototype = new Element()
CraftRef.prototype.constructor = CraftRef

CraftRef.prototype.render = function(scope) {
    this.emit('render', this, scope)

    var craft = scope[this.ref]
    // TODO: handle craft ref not resolved error

    scope.contents = this.contents
        
    var solid = craft.render(scope)
    this.rendered = solid
    return solid
}