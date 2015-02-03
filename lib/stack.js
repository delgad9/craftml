'strict'

var Element = require('./element')

module.exports = Stack

function Stack() {
    this.contents = []
    this.type = 'Stack'
}

Stack.prototype = new Element()
Stack.prototype.constructor = Stack

Stack.prototype.doLayout = function(solids) {
    var tz = 0
    solids.reverse().forEach(function(solid) {
        solid.layout.z = tz
        tz = tz + solid.layout.depth
    })   
}

