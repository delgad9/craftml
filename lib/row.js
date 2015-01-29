'strict'

var Block = require('./block')

module.exports = Row

function Row() {
    this.contents = []
    this.type = 'row'
}

Row.prototype = new Block()
Row.prototype.constructor = Row

Row.prototype.doLayout = function(solids) {
    // do layout
    var tx = 0
    solids.forEach(function(solid) {
        solid.layout.x = tx
        tx = tx + solid.layout.width
    })
}

