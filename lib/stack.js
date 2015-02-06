'strict'

var Element = require('./element'),
    _ = require('lodash')

module.exports = Stack

function Stack() {
    this.contents = []
    this.tag = 'Stack'
}

Stack.prototype = new Element()
Stack.prototype.constructor = Stack

Stack.prototype.doLayout = function(solids) {
    var tz = 0
    solids.reverse().forEach(function(solid) {
        solid.layout.z = tz
        tz = tz + solid.layout.depth

        // center
        solid.layout.x = -solid.layout.width / 2
        solid.layout.y = -solid.layout.height / 2
    })

    var xmin = _.min(solids.map(function(c) {
        return c.layout.x
    }))

    var ymin = _.min(solids.map(function(c) {
        return c.layout.y
    }))

    solids.forEach(function(solid){

        solid.layout.x = solid.layout.x - xmin
        solid.layout.y = solid.layout.y - ymin

    })
}