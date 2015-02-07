var debug = require('debug')('craft.layout')
var layout = {}

layout.row = function(children, parent) {
    debug('row')
    var tx = 0 //children[0].layout.location.x
    children.forEach(function(solid, i) {
        solid.layout.location.x = tx
        tx = tx + solid.layout.size.x

        // center along y
        solid.layout.location.y = - solid.layout.size.y / 2

        debug("    (%d) %o", i, solid.layout)
    })

    var xrange = {}
    var yrange = {}
    var zrange = {}
    xrange.min = _.min(children.map(function(c) {
        return c.layout.location.x
    }))
    xrange.max = _.max(children.map(function(c) {
        return c.layout.location.x + c.layout.size.x
    }))
    yrange.min = _.min(children.map(function(c) {
        return c.layout.location.y
    }))
    yrange.max = _.max(children.map(function(c) {
        return c.layout.location.y + c.layout.size.y
    }))
    zrange.min = _.min(children.map(function(c) {
        return c.layout.location.z
    }))
    zrange.max = _.max(children.map(function(c) {
        return c.layout.location.z + c.layout.size.z
    }))

    children.forEach(function(solid, i) {

        solid.layout.location.y = solid.layout.location.y - yrange.min

        debug("   (->%d) %o", i, solid.layout)
    })


    parent.layout.size = {
        x: xrange.max - xrange.min,
        y: yrange.max - yrange.min,
        z: zrange.max - zrange.min
    }

    debug("   parent: %o", parent.layout)
    debug('/row')
}

layout.column = function(children, parent) {
    debug('column')
    var ty = 0
    children.reverse().forEach(function(solid, i) {
        solid.layout.location.y = ty
        ty = ty + solid.layout.size.y

        // center along x        
        solid.layout.location.x = - solid.layout.size.x / 2

        debug("    (%d) %o", i, solid.layout)
    })

    var xrange = {}
    var yrange = {}
    var zrange = {}
    xrange.min = _.min(children.map(function(c) {
        return c.layout.location.x
    }))
    xrange.max = _.max(children.map(function(c) {
        return c.layout.location.x + c.layout.size.x
    }))
    yrange.min = _.min(children.map(function(c) {
        return c.layout.location.y
    }))
    yrange.max = _.max(children.map(function(c) {
        return c.layout.location.y + c.layout.size.y
    }))
    zrange.min = _.min(children.map(function(c) {
        return c.layout.location.z
    }))
    zrange.max = _.max(children.map(function(c) {
        return c.layout.location.z + c.layout.size.z
    }))

    children.forEach(function(solid, i) {

        solid.layout.location.x = solid.layout.location.x - xrange.min        

        debug("   (->%d) %o", i, solid.layout)
    })


    parent.layout.size = {
        x: xrange.max - xrange.min,
        y: yrange.max - yrange.min,
        z: zrange.max - zrange.min
    }

    debug("   parent: %o", parent.layout)
    debug('/column')
}

layout.absolute = function(children, parent) {
    debug('absoluteLayout')
    children.forEach(function(solid, i) {
        debug("    (%d) %o", i, solid.layout)
    })

    var xrange = {}
    var yrange = {}
    var zrange = {}
    xrange.min = _.min(children.map(function(c) {
        return c.layout.location.x
    }))
    xrange.max = _.max(children.map(function(c) {
        return c.layout.location.x + c.layout.size.x
    }))
    yrange.min = _.min(children.map(function(c) {
        return c.layout.location.y
    }))
    yrange.max = _.max(children.map(function(c) {
        return c.layout.location.y + c.layout.size.y
    }))
    zrange.min = _.min(children.map(function(c) {
        return c.layout.location.z
    }))
    zrange.max = _.max(children.map(function(c) {
        return c.layout.location.z + c.layout.size.z
    }))

    parent.layout.size = {
        x: xrange.max,
        y: yrange.max,
        z: zrange.max
    }
    parent.layout.location = {
        x: 0,
        y: 0,
        z: 0
    }

    debug("   parent: %o", parent.layout)
    debug('/absoluteLayout')
}


layout.stack = function(children, parent) {
    debug('stack')
    var tz = 0
    children.reverse().forEach(function(solid, i) {

        solid.layout.location.z = tz
        tz = tz + solid.layout.size.z

        // center
        solid.layout.location.x = -solid.layout.size.x / 2
        solid.layout.location.y = -solid.layout.size.y / 2

        debug("    (%d) %o", i, solid.layout)
    })

    var xmin = _.min(children.map(function(c) {
        return c.layout.location.x
    }))

    var ymin = _.min(children.map(function(c) {
        return c.layout.location.y
    }))


    var xrange = {}
    var yrange = {}
    var zrange = {}
    xrange.min = _.min(children.map(function(c) {
        return c.layout.location.x
    }))
    xrange.max = _.max(children.map(function(c) {
        return c.layout.location.x + c.layout.size.x
    }))
    yrange.min = _.min(children.map(function(c) {
        return c.layout.location.y
    }))
    yrange.max = _.max(children.map(function(c) {
        return c.layout.location.y + c.layout.size.y
    }))
    zrange.min = _.min(children.map(function(c) {
        return c.layout.location.z
    }))
    zrange.max = _.max(children.map(function(c) {
        return c.layout.location.z + c.layout.size.z
    }))

    parent.layout.size = {
        x: xrange.max - xrange.min,
        y: yrange.max - yrange.min,
        z: zrange.max - zrange.min
    }

    children.forEach(function(solid, i) {

        solid.layout.location.x = solid.layout.location.x - xmin
        solid.layout.location.y = solid.layout.location.y - ymin

        debug("   (->%d) %o", i, solid.layout)
    })

    debug("   parent: %o", parent.layout)
    debug('/stack')
}


module.exports = layout