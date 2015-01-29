'strict'

var Block = require('./block')

module.exports = Stack

function Stack() {
    this.contents = []
}

Stack.prototype = new Block()
Stack.prototype.constructor = Stack

Stack.prototype.doLayout = function(solids) {
    var tz = 0
    solids.reverse().forEach(function(solid) {
        solid.layout.z = tz
        tz = tz + solid.layout.depth
    })   
}

