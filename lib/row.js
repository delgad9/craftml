'strict'

var Solid = require('./solid')

module.exports = Row

function Row(contents) {
    this.contents = contents
}

Row.prototype.render = function() {
    var solids = this.contents.map(function(block) {
        return block.render()
    })

    // do layout
    var tx = 0
    solids.forEach(function(solid) {
        solid.layout.x = tx
        tx = tx + solid.layout.width
    })

    var solid = new Solid()
    solid.children = solids
    solid.fitToChildren()

    return solid
}


