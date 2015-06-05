var _ = require('lodash'),
    $$$ = require('./scad'),
    Location = require('./location'),
    Size = require('./size')

module.exports = Solid

// Box enclosing a solid, used for spatial arrangements
function Box(){
    this.size = new Size()
    this.location = new Location()
}

Box.prototype.clone = function(){
    var copy = new Box()
    copy.size = new Size()
    copy.size.x = this.size.x
    copy.size.y = this.size.y
    copy.size.z = this.size.z
    copy.location = new Location()
    copy.location.x = this.location.x
    copy.location.y = this.location.y
    copy.location.z = this.location.z
    return copy
}

Box.prototype.translate = function(x,y,z){
    this.location.x += x
    this.location.y += y
    this.location.z += z
}

Box.prototype.scale = function(x,y,z){
    this.size.x *= x
    this.size.y *= y
    this.size.z *= z
}

Box.prototype.transform = function(m, n){
    var o = this.location
    var s = this.size
    var c = $$$.cube([s.x,s.y,s.z]).translate([o.x,o.y,o.z])
    c = c.transform(m)
    b = computeLayout(c)
    this.location = b.location
    this.size = b.size

    this.m = m
    if (n){
        this.n = n
    } else {
        this.n = null
    }
}

Box.prototype.revert = function(){
    if (this.n){
        this.transform(this.n)
        delete this.n
        delete this.m
    }
}

Box.prototype.convert = function(tm){
    if (this.m && this.n){
        return this.m.multiply(tm).multiply(this.n)
    } else {
        return tm
    }
}

function Solid(csg) {
    this.type = 'solid'
    this.layout = new Box()

    // transformation matrix w.r.t. parent
    this.m = $$$.CSG.Matrix4x4.unity()
    // inverse transformation matrix for reverting
    this.n = $$$.CSG.Matrix4x4.unity()

    this.transforms = []

    if (csg) {
        this.csg = csg
        this.fitToCSG()
    }
    this.children = []
}

Solid.prototype.getBounds = function(){
    return this.layout
}

Solid.prototype.getLocation = function(){
    return this.layout.location
}

Solid.prototype.getSize = function(){
    return this.layout.size
}

Solid.prototype.debug = function(){
    return {
        getPolygonsBounds: function(){
            return computeLayout(this.csg)
        }.bind(this)
    }
}

Solid.prototype.clone = function(){
    var clone = new Solid(this.csg)
    clone.type = this.type
    clone.m = this.m
    clone.layout = this.layout.clone()
    clone.children = _.map(this.children, function(c){
        return c.clone()
    })
    clone.color = this.color
    return clone
}

Solid.prototype.fitToCSG = function() {
    var layout = computeLayout(this.csg)
    this.layout = layout
}

function computeLayout(csg) {
    var b = csg.getBounds()
    var cube = new Box()
    cube.location = new Location(b[0].x,b[0].y,b[0].z)
    cube.size = new Size(b[1].x-b[0].x,b[1].y-b[0].y,b[1].z-b[0].z)
    return cube
}

//
// Hierarchy
//

Solid.prototype.setChildren = function(children){
    _.forEach(children, function(c){
        c.parent = this
    },this)
    this.children = children
    this.fitToChildren()
}


// compute a combined transformation matrix to an ancestor
function _compute_tm_from_to(solid, ancestor){
    if (solid.parent && solid.parent === ancestor){
        return {m: solid.m, n: solid.n}
    } else if (solid.parent){
        var r = _compute_tm_from_to(solid.parent, ancestor)
        if (r)
            return {m: solid.m.multiply(r.m), n: r.n.multiply(solid.n)}
    }
}

// the solid specified as the argument must be an ancestor of this solid
// otherwise, this method does nothing
Solid.prototype.convertCoordinateTo = function(ancestor){

    if (ancestor === this.parent){

        this.layout.revert()

    } else {

        var r = _compute_tm_from_to(this.parent, ancestor)
        if (r){
            this.layout.revert()
            this.layout.transform(r.m, r.n)
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

        // console.log(this.layout)

        this.layout.size = new Size(
            xrange.max - xrange.min,
            yrange.max - yrange.min,
            zrange.max - zrange.min
        )

        this.layout.location = new Location(
            xrange.min,
            yrange.min,
            zrange.min
        )
    }
}

//
// Transformation
//

function _location_partial(func){
    return function(){
        var loc
        if (arguments.length === 3){
            loc = new Location(arguments[0], arguments[1], arguments[2])
        } else if (arguments.length === 1){
            var o = arguments[0]
            if (_.isObject(o)){
                loc = new Location(o.x, o.y, o.z)
            } else {
                loc = new Location(o, o, o)
            }
        } else {
            loc = new Location(0,0,0)
        }
        return func.apply(this, [loc])
    }
}

function translate(loc){
    // update transformation matrix

    var tm = $$$.CSG.Matrix4x4.translation([loc.x, loc.y, loc.z])
    var tn = $$$.CSG.Matrix4x4.translation([-loc.x, -loc.y, -loc.z])

    tm = this.layout.convert(tm)
    tn = this.layout.convert(tn)

    this.m = this.m.multiply(tm)
    this.n = tn.multiply(this.n)

    // update layout
    this.layout.translate(loc.x,loc.y,loc.z)
}

function translateTo(loc){

    // update transformation matrix
    var d = {}
    _.forEach(loc, function(v, dim){
        d[dim] = v - this.layout.location[dim]
    }, this)

    var tm = $$$.CSG.Matrix4x4.translation([d.x, d.y, d.z])
    var tn = $$$.CSG.Matrix4x4.translation([-d.x, -d.y, -d.z])

    tm = this.layout.convert(tm)
    tn = this.layout.convert(tn)

    this.m = this.m.multiply(tm)
    this.n = tn.multiply(this.n)

    // update layout
    this.layout.location = new Location(loc.x,loc.y,loc.z)
}

function centerAt(loc) {
    var size = this.layout.size
    var newLoc = {
        x: loc.x - size.x/2,
        y: loc.y - size.y/2,
        z: loc.z - size.z/2
    }
    this.translateTo(newLoc)
}

function scale(s) {
    // TODO: handle 0's

    var savedLoc = _.clone(this.layout.location)
    var loc = {
        x: 0,
        y: 0,
        z: 0
    }
    this.translateTo(loc)

    var tm = $$$.CSG.Matrix4x4.scaling([s.x, s.y, s.z])
    var tn = $$$.CSG.Matrix4x4.scaling([1/s.x, 1/s.y, 1/s.z])

    tm = this.layout.convert(tm)
    tn = this.layout.convert(tn)

    this.m = this.m.multiply(tm)
    this.n = tn.multiply(this.n)

    this.layout.scale(s.x,s.y,s.z)
    this.translateTo(savedLoc)
}

function scaleTo(newSize) {
    var oldSize = this.layout.size
    var ratio = {
        x: newSize.x / oldSize.x,
        y: newSize.y / oldSize.y,
        z: newSize.z / oldSize.z
    }
    this.scale(ratio)
}

function rotate(axis, degrees, point) {
    if (point){
        if (_.isArray(point)){
            var loc = {
                x: - point[0],
                y: - point[1],
                z: - point[2]
            }
        }else {
            var loc = {
                x: - point.x,
                y: - point.y,
                z: - point.z
            }
        }
    } else {
        // w.r.t. center
        var s = this.layout.size
        var loc = {
            x: - s.x / 2,
            y: - s.y / 2,
            z: - s.z / 2
        }
    }
    var savedLoc = _.clone(this.layout.location)
    this.translateTo(loc)

    var m = $$$.CSG.Matrix4x4['rotation' + axis.toUpperCase()](degrees)
    this.m = this.m.multiply(m)

    this.translateTo(savedLoc)
    this.apply()
}

Solid.prototype.translate = _location_partial(translate)
Solid.prototype.translateTo = _location_partial(translateTo)
Solid.prototype.centerAt = _location_partial(centerAt)
Solid.prototype.scale = _location_partial(scale)
Solid.prototype.scaleTo = _location_partial(scaleTo)
Solid.prototype.rotateX = _.partial(rotate,'x')
Solid.prototype.rotateY = _.partial(rotate,'y')
Solid.prototype.rotateZ = _.partial(rotate,'z')

var addWith = require('with')
Solid.prototype.transformEval = function(code, params){

    params = params || {}

    var methods = {
        translate:  this.translate.bind(this),
        translateTo: this.translateTo.bind(this),
        scale: this.scale.bind(this),
        scaleTo: this.scaleTo.bind(this),
        centerAt: this.centerAt.bind(this),
        rotateX: this.rotateX.bind(this),
        rotateY: this.rotateY.bind(this),
        rotateZ: this.rotateZ.bind(this)
    }
    var env = _.merge(methods, params)

    // TODO: sanitize 'code'
    var scode = code.replace(/\)/g,');')

    // Scoping: code has access to Global variables and env

    var withExpr = addWith('env', scode)
    var f = new Function('env', withExpr)
    f(env)
}

Solid.prototype.alignEval = function(code){

    // e.g.,
    //
    // code = 'x50 y50'
    //
    // code = 'x50 y100 z0'
    //
    // code = 'x-50 y100 z0'

    var toks = code.split(' ')

    function parse(e){
        var m = e.match(/(x|y|z)(-*\d+)/)
        return {
            dim: m[1],
            value: m[2]
        }
    }

    function align(solids, dim, v){
        var first = solids[0]
        solids.slice(1).forEach(function(solid) {

            var newLoc = _.clone(solid.layout.location)
            var percent = v
            if (!isNaN(percent)) {
                newLoc[dim] = first.layout.location[dim] +
                    (first.layout.size[dim] - solid.layout.size[dim]) * percent / 100
            }
            solid.translateTo(newLoc)
        })
    }

    _.forEach(toks, function(tok){
        var p = parse(tok)
        align(this.children, p.dim, p.value)

    }.bind(this))

    this.fitToChildren1()
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

var _s = require('./solids')

Solid.prototype.showTransforms = function(){
    console.log('\n')
    _.forEach(this.transforms, function(t){
        console.log(t.debug)
    })
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
            // solid.showTransforms()
        }

        if (solid.children && solid.children.length > 0) {

            solid.children.forEach(function(c) {

                // pass color to child (when the child's color is undefined)
                if (solid.color && c.color === undefined){
                    c.color = solid.color
                }

                _applyTranformation(c, m)
            })

            solid.fitToChildren()

            // TODO: cropping
            // if (solid.layout.crop) {
            //     solid.layout.crop.csg = solid.layout.crop.csg.transform(m)
            //     _applyCrop(solid)
            // }

        }
    }

}
//
// Solid.prototype.fitToChildren = function() {
//
//     if (this.children) {
//
//         var xrange = {}
//         var yrange = {}
//         var zrange = {}
//         xrange.min = _.min(this.children.map(function(c) {
//             return c.layout.location.x
//         }))
//         xrange.max = _.max(this.children.map(function(c) {
//             return c.layout.location.x + c.layout.size.x
//         }))
//         yrange.min = _.min(this.children.map(function(c) {
//             return c.layout.location.y
//         }))
//         yrange.max = _.max(this.children.map(function(c) {
//             return c.layout.location.y + c.layout.size.y
//         }))
//         zrange.min = _.min(this.children.map(function(c) {
//             return c.layout.location.z
//         }))
//         zrange.max = _.max(this.children.map(function(c) {
//             return c.layout.location.z + c.layout.size.z
//         }))
//
//         this.layout.size = {
//             x: xrange.max - xrange.min,
//             y: yrange.max - yrange.min,
//             z: zrange.max - zrange.min
//         }
//
//         this.layout.location = {
//             x: xrange.min,
//             y: yrange.min,
//             z: zrange.min
//         }
//     }
// }

Solid.prototype.fitToChildren1 = Solid.prototype.fitToChildren
