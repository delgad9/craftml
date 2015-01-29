var debug = require('debug')('craft.block')

module.exports = Block

var _ = require('lodash'),
    Solid = require('./solid'),
    CraftRef = require('./craftref'),
    Craft = require('./craft')

function Block() {
    this.contents = []
}

Block.prototype.doLayout = rowLayout

Block.prototype.render = function(scope) {
    scope = scope || {}

    // compute scope
    var scope = _.clone(scope)
    this.contents.forEach(function(block) {
        if (block instanceof Craft) {
            scope[block.name] = block
        }
    })

    // render all contents nodes to solids
    var solids = _(this.contents)
        .map(function(block) {

            if (block instanceof Craft) {
                // do not render Craft
                debug('craft')

            } else if (block instanceof CraftRef) {
                debug('craftref')
                return scope[block.name].render(scope)
            } else {

                return block.render(scope)
            }
        })
        .compact(solids)
        .value()

    debug(solids)


    // layout these solids
    this.doLayout(solids)

    // create a parent Solid to group these solids under
    var solid = new Solid()
    solid.children = solids
    solid.fitToChildren()
    return solid
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