'strict'

var Craft = require('./craft')

module.exports = Stack

function Stack(contents) {
    this.contents = contents
}

Stack.prototype = new Craft()
Stack.prototype.constructor = Stack

Stack.prototype.doLayout = function(solids) {
    var tz = 0
    solids.reverse().forEach(function(solid) {
        solid.layout.z = tz
        tz = tz + solid.layout.depth
    })   
}

