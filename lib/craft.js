var debug = require('debug')('craft.craft')

module.exports = Craft

var Element = require('./element')

function Craft() {
    this.contents = []
    this.type = 'Craft'
}

Craft.prototype = new Element()
Craft.prototype.constructor = Craft