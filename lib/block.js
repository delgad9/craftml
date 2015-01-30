var debug = require('debug')('craft.block')

module.exports = Block

var _ = require('lodash'),
    Solid = require('./solid'),
    CraftRef = require('./craftref'),
    Craft = require('./craft'),
    Place = require('./place')

function Block() {
    this.contents = []
}

Block.prototype.doLayout = rowLayout

Block.prototype.renderContents = function(contents, scope) {

    // compute scope
    var scope = _.clone(scope)
    contents.forEach(function(block) {
        if (block instanceof Craft) {
            scope[block.name] = block
        }
    })

    var solids = _(contents)
        .map(function(block) {

            debug('   processing child %o', block.type)

            if (block instanceof Craft) {
                // do not render Craft

            } else if (block instanceof CraftRef) {

                scope.contents = block.contents
                return scope[block.name].render(scope)

            } else if (block instanceof Place) {

                debug('contents to inject %o', scope.contents)
                // scope.contents = contents
                return block.render(scope)

            } else {
                //scope.contents = contents       
                return block.render(scope)
            }
        })
        .compact()
        .flatten()
        .value()

    return solids
}

Block.prototype.render = function(scope) {
    scope = scope || {}
    debug('rendering %s:', this.type)
    var contents = this.contents
    var solids = this.renderContents(contents, scope)

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