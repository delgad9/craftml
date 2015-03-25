var _ = require('lodash'),
    $$$ = require('craft-scad')

module.exports = Solid

function Solid(csg) {
    this.type = 'solid'
    if (csg) {
        this.csg = csg
        this.layout = computeLayout(csg)
    } else {
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
    }
    this.children = []
}

Solid.prototype.fitToCSG = function() {
    computeLayout(this.csg)
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


        var m = matrix || $$$.CSG.Matrix4x4.unity()

        // rotation
        if (node.layout.rotate) {

            var r = node.layout.rotate

            var c = ['x', 'y', 'z'].map(function(dim) {
                return -node.layout.location[dim] - node.layout.size[dim] / 2
            })

            var d = ['x', 'y', 'z'].map(function(dim) {
                return node.layout.location[dim] + node.layout.size[dim] / 2
            })

            m = $$$.CSG.Matrix4x4.translation(d).multiply(m)
            if (r.axis === 'x') {
                m = $$$.CSG.Matrix4x4.rotationX(r.degrees).multiply(m)
            } else if (r.axis === 'y') {
                m = $$$.CSG.Matrix4x4.rotationY(r.degrees).multiply(m)
            } else if (r.axis === 'z') {
                m = $$$.CSG.Matrix4x4.rotationZ(r.degrees).multiply(m)
            }
            m = $$$.CSG.Matrix4x4.translation(c).multiply(m)

        }

        // translation
        var loc = node.layout.location
        m = $$$.CSG.Matrix4x4.translation([loc.x, loc.y, loc.z]).multiply(m)

        // scale
        if (node.layout.scale) {
            var s = node.layout.scale
            m = $$$.CSG.Matrix4x4.scaling([s.x, s.y, s.z]).multiply(m)
        }

        if (node.csg) {
            var solid = node

            if (solid.csg) {
                var cb = solid.csg.getBounds()
                m = $$$.CSG.Matrix4x4.translation([-cb[0].x, -cb[0].y, -cb[0].z]).multiply(m)
                solid.csg = solid.csg.transform(m)
            }

        }

        if (node.children && node.children.length > 0) {            

            node.children.forEach(function(c) {

                _applyTranformation(c, m)

            })

            // cropping
            if (node.layout.crop) {
                node.layout.crop.csg = node.layout.crop.csg.transform(m)
                _applyCrop(node)
            }

        }
    }

}

Solid.prototype.scale = function(s) {
    this.layout.size.x = this.layout.size.x * s.x
    this.layout.size.y = this.layout.size.y * s.y
    this.layout.size.z = this.layout.size.z * s.z
    this.layout.scale = s
}

Solid.prototype.rotate = function(axis, degrees) {
    this.layout.rotate = {
        axis: axis,
        degrees: degrees
    }
}

// Group.prototype.crop = function(x,y,z) {
//     // this.layout.size.x = this.layout.size.x * s[0]
//     // this.layout.size.y = this.layout.size.y * s[1]
//     // this.layout.size.z = this.layout.size.z * s[2]
//     this.layout.crop = {
//         x: x,
//         y: y,
//         z: z
//     }
// }

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

        this.layout.location = {
            x: xrange.min,
            y: yrange.min,
            z: zrange.min
        }


        this.children.forEach(function(c) {
            c.layout.location.x = c.layout.location.x - xrange.min
            c.layout.location.y = c.layout.location.y - yrange.min
            c.layout.location.z = c.layout.location.z - zrange.min
        })

        // this.layout.location = {
        //     x: 0,
        //     y: 0,
        //     z: 0
        // }
    }
}