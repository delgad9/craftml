var debug = require('debug')('craft.craft')

module.exports = Craft

var Element = require('./element')

function Craft() {
    Element.apply(this)
}

Craft.prototype = new Element()
Craft.prototype.constructor = Craft