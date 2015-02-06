'strict'

var Element = require('./element')

module.exports = Row

function Row() {
    Element.apply(this)
}

Row.prototype = new Element()
Row.prototype.constructor = Row

Row.prototype.doLayout = function(solids) {
    // do layout
    var tx = 0
    solids.forEach(function(solid) {
        solid.layout.x = tx
        tx = tx + solid.layout.width
    })
}

