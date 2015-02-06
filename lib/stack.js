'strict'

var Element = require('./element'),
    _ = require('lodash'),
    layout = require('./layout')

module.exports = Stack

function Stack() {
    Element.apply(this)
}

Stack.prototype = new Element()
Stack.prototype.constructor = Stack
Stack.prototype.doLayout = layout.stack

