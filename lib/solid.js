var _ = require('lodash'),
    $$$ = require('./scad')

module.exports = Solid

function Solid(csg) {
    this.type = 'solid'

    this.layout = {
        location: {
            x: 0,
            y: 0,
            z: 0
        },
        size: {
            x: 0,
            y: 0,
            z: 0
        }
    }
    this.m = $$$.CSG.Matrix4x4.unity()

    if (csg) {
        this.csg = csg
        this.fitToCSG()
    }

    this.children = []
}

Solid.prototype.fitToCSG = function() {
    var layout = computeLayout(this.csg)
    this.layout = layout
}

function computeLayout(csg) {
    var cb = csg.getBounds()
    var layout = {}
    return {
        size: {
            x: cb[1].x - cb[0].x,
            y: cb[1].y - cb[0].y,
            z: cb[1].z - cb[0].z
        },
        location: {
            x: cb[0].x,
            y: cb[0].y,
            z: cb[0].z
        }
    }
}

Solid.prototype.translate = function(loc) {
    this.m = this.m.multiply($$$.CSG.Matrix4x4.translation([loc.x, loc.y, loc.z]))
    _.forEach(['x', 'y', 'z'], function(dim) {
        this.layout.location[dim] = this.layout.location[dim] + loc[dim]
    }, this)
}

Solid.prototype.translateTo = function(loc) {
    var d = {
        x:0,
        y:0,
        z:0
    }
    _.forEach(loc, function(v, dim){
        d[dim] = v - this.layout.location[dim]
    }, this)
    this.translate(d)
}

Solid.prototype.transformEval = function(code){

    var scale = function(x,y,z){
        this.scale({x:x, y:y, z:z})
    }.bind(this)

    var translate = function(x,y,z){
        this.translate({x:x, y:y, z:z})
    }.bind(this)

    var rotateX = function(degrees){
        this.rotate('x', degrees)
    }.bind(this)

    var rotateY = function(degrees){
        this.rotate('y', degrees)
    }.bind(this)

    var rotateZ = function(degrees){
        this.rotate('z', degrees)
    }.bind(this)

    // TODO: sanitize 'code'
    var scode = code.split(' ').join(';')
    eval(scode)
}

Solid.prototype.scale = function(s) {
    var savedLoc = _.clone(this.layout.location)
    // var loc = {
    //     x: - s.x / 2,
    //     y: - s.y / 2,
    //     z: - s.z / 2
    // }
    var loc = {
        x: 0,
        y: 0,
        z: 0
    }
    this.translateTo(loc)
    this.m = this.m.multiply($$$.CSG.Matrix4x4.scaling([s.x, s.y, s.z]))
    _.forEach(['x', 'y', 'z'], function(dim) {
        this.layout.size[dim] = this.layout.size[dim] * s[dim]
    }, this)
    this.translateTo(savedLoc)
}

Solid.prototype.rotate = function(axis, degrees) {
    var s = this.layout.size
    var savedLoc = _.clone(this.layout.location)
    var loc = {
        x: - s.x / 2,
        y: - s.y / 2,
        z: - s.z / 2
    }
    this.translateTo(loc)
    var m = $$$.CSG.Matrix4x4['rotation' + axis.toUpperCase()](degrees)
    this.m = this.m.multiply(m)
    this.translateTo(savedLoc)
    this.apply()
}

Solid.prototype.apply = function() {
    _applyTranformation(this)
}

function _applyCrop(node) {
    if (node.layout.crop.csg)
        _crop_recursively(node, node.layout.crop.csg)
}

function _crop_recursively(node, toCrop) {
    if (node.csg) {
        node.csg = node.csg.subtract(toCrop)
    }

    if (node.children) {
        node.children.forEach(function(c) {
            _crop_recursively(c, toCrop)
        })
    }
}

function _applyTranformation(node, matrix) {

    if (_.isArray(node)) {

        node.forEach(function(x) {
            _applyTranformation(x)
        })

    } else {

        var solid = node

        var m = matrix || $$$.CSG.Matrix4x4.unity()

        if (solid.m) {
            m = solid.m.multiply(m)
            solid.m = $$$.CSG.Matrix4x4.unity()
        }

        if (solid.csg && solid.m) {
            // do the transform
            solid.csg = solid.csg.transform(m)
            if (solid.color){
                solid.csg.color = solid.color
            }
            solid.fitToCSG()
        }

        if (solid.children && solid.children.length > 0) {

            solid.children.forEach(function(c) {

                // pass color to child (when the child's color is undefined)
                if (solid.color && c.color === undefined){
                    c.color = solid.color
                }

                _applyTranformation(c, m)
            })
            solid.fitToChildren1()

            // TODO: cropping
            // if (solid.layout.crop) {
            //     solid.layout.crop.csg = solid.layout.crop.csg.transform(m)
            //     _applyCrop(solid)
            // }

        }
    }

}

Solid.prototype.fitToChildren = function() {

    if (this.children) {

        var xrange = {}
        var yrange = {}
        var zrange = {}
        xrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.x
        }))
        xrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.x + c.layout.size.x
        }))
        yrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.y
        }))
        yrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.y + c.layout.size.y
        }))
        zrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.z
        }))
        zrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.z + c.layout.size.z
        }))

        this.layout.size = {
            x: xrange.max - xrange.min,
            y: yrange.max - yrange.min,
            z: zrange.max - zrange.min
        }

        var origin = {
            x: xrange.min,
            y: yrange.min,
            z: zrange.min
        }

        this.translateTo(origin)

        var d = {
            x: -xrange.min,
            y: -yrange.min,
            z: -zrange.min
        }

        this.children.forEach(function(c) {
            c.translate(d)
            // c.layout.location.x = c.layout.location.x - xrange.min
            // c.layout.location.y = c.layout.location.y - yrange.min
            // c.layout.location.z = c.layout.location.z - zrange.min
        })

    }
}

Solid.prototype.fitToChildren1 = function() {

    if (this.children) {

        var xrange = {}
        var yrange = {}
        var zrange = {}
        xrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.x
        }))
        xrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.x + c.layout.size.x
        }))
        yrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.y
        }))
        yrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.y + c.layout.size.y
        }))
        zrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.z
        }))
        zrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.z + c.layout.size.z
        }))

        this.layout.size = {
            x: xrange.max - xrange.min,
            y: yrange.max - yrange.min,
            z: zrange.max - zrange.min
        }

        this.layout.location = {
            x: xrange.min,
            y: yrange.min,
            z: zrange.min
        }
    }
}
