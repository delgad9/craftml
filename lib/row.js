'strict'

var Craft = require('./craft')

module.exports = Row

function Row(contents) {
    this.contents = contents
}

Row.prototype = new Craft()
Row.prototype.constructor = Row

Row.prototype.doLayout = function(solids) {
    // do layout
    var tx = 0
    solids.forEach(function(solid) {
        solid.layout.x = tx
        tx = tx + solid.layout.width
    })
}

