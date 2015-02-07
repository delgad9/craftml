'strict'

var Element = require('./element'),
    layout = require('./layout')

module.exports = Column

function Column() {
    Element.apply(this)
}

Column.prototype = new Element()
Column.prototype.constructor = Column
Column.prototype.doLayout = layout.column