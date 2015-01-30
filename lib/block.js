var debug = require('debug')('craft.block')

module.exports = Block

var _ = require('lodash'),
    Solid = require('./solid'),
    CraftRef = require('./craftref'),
    Craft = require('./craft'),
    Place = require('./place')
    Scope = require('./scope')

function Block() {
    this.contents = []
}

Block.prototype.doLayout = rowLayout

Block.prototype.renderContents = function(contents, scope) {


    contents.forEach(function(element){
        scope.addElement(element)
    })

    // compute scope
    contents.forEach(function(block) {
        if (block instanceof Craft) {
            scope[block.name] = block
        }
    })

    var solids = _(contents)
        .map(function(block) {

            debug('   processing child %o, name=%s', block.type, block.name)

            if (block instanceof Craft) {
                // do not render Craft

            } else if (block instanceof CraftRef) {

                scope.contents = block.contents
                var solid = scope[block.ref].render(scope)
                block.rendered = solid
                return solid

            } else if (block instanceof Place) {

                debug('contents to inject %o', scope.contents)
                return block.render(scope)

            } else {
                return block.render(scope)
            }
        })
        .compact()
        .flatten()
        .value()

    return solids
}

Block.prototype.render = function(scope) {
    scope = scope || new Scope() 

    debug('rendering %s, name=%s:', this.type, this.name)
    var contents = this.contents
    var solids = this.renderContents(contents, scope)

    // layout these solids
    this.doLayout(solids)    

    // create a parent Solid to group these solids under
    var solid = new Solid()
    solid.children = solids
    solid.fitToChildren()

    this.rendered = solid
    return solid
}

Block.prototype.getSize = function(){
    // var rendered = true
    if (this.rendered){
        return this.rendered.layout.size
    }
}

function rowLayout(solids) {
    var tx = 0
    solids.forEach(function(solid) {
        solid.layout.x = tx
        tx = tx + solid.layout.width
    })
}

function stackLayout(solids) {
    var tz = 0
    solids.forEach(function(solid) {
        solid.layout.z = tz
        tz = tz + solid.layout.depth
    })
}