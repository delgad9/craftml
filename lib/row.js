'strict'

var Element = require('./element')

module.exports = Row

function Row() {
    Element.apply(this)
}

Row.prototype = new Element()
Row.prototype.constructor = Row
