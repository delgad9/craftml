var debug = require('debug')('craft.craft')

module.exports = Craft

var Block = require('./block')

function Craft() {
    this.contents = []
    this.type = 'Craft'
}

Craft.prototype = new Block()
Craft.prototype.constructor = Craft