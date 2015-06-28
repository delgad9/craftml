var _ = require('lodash'),
    Matrix4x4 = require('../scad/geometry/Matrix4x4'),
    Location = require('../location'),
    Box = require('../box'),
    Size = require('../size')

var select = require('../render/select')

export default class Solid {

    constructor() {

        if (arguments.length === 1) {
            // Solid(csg)
            this.layout = new Box()
            this.box = new Box()
            var csg = arguments[0]
            this.csg = csg
            this.fitToCSG()

        } else if (arguments.length === 2) {
            // Solid(location, size)

            var o = arguments[0]
            var s = arguments[1]
            this.layout = new Box(o, s)
            this.box = new Box(o, s)

        } else {

            this.layout = new Box()
            this.box = new Box()
        }

        this.type = 'solid'
            // transformation matrix w.r.t. parent
        this.m = Matrix4x4.unity()
            // inverse transformation matrix for reverting
        this.n = Matrix4x4.unity()

        this.children = []
    }

    // create a solid from a group of solids
    static fromGroup(solids) {
        var grp = new Solid()
            //console.log('data', scope.data)
        grp.setChildren(solids)
        return grp
    }

    getBounds() {
        return this.layout
    }

    getLocation() {
        return this.layout.location
    }

    getSize() {
        return this.layout.size
    }

    debug() {
        return {
            getPolygonsBounds: function() {
                return computeLayout(this.csg)
            }.bind(this)
        }
    }

    clone() {
        if (this.csg) {
            var clone = new Solid(this.csg)
        } else {
            var clone = new Solid()
        }
        clone.type = this.type
        clone.class = this.class
        clone.m = this.m
        clone.n = this.n
        clone.layout = this.layout.clone()
        clone.box = this.box.clone()
        clone.children = _.map(this.children, function(c) {
            return c.clone()
        })
        clone.color = this.color
        return clone
    }


    find(selector) {
        var selected = select(this.children, selector)
        return selected
    }



    setChildren(children) {
        _.forEach(children, function(c) {
            c.parent = this
        }, this)
        this.children = children
        this.fitToChildren()
    }



    // Convert the layout box to the coordinate system of
    // a destination solid. The destination solid must be
    // an ancestor of this solid
    convertCoordinateTo(ancestor) {

        if (ancestor === this) {
            // do nothing, since ancestor can not be itself
            return
        }

        if (this.layout_reference) {

            if (ancestor === this) {

                // reset
                var r = _compute_tm_from_to(this.parent, this.layout_reference)
                this.layout.transform_apply(r.n)
                delete this.layout_reference

            } else {

                var pr = _compute_tm_from_to(this.parent, ancestor)
                var qr = _compute_tm_from_to(this.parent, this.layout_reference)

                if (qr) {
                    this.layout.transform(qr.n)
                }
                if (pr) {
                    this.layout.transform(pr.m)
                }
                this.layout_reference = ancestor
            }

        } else {

            var r = _compute_tm_from_to(this.parent, ancestor)
            if (r) {
                this.layout.transform(r.m)
                this.layout_reference = ancestor
            }
        }
    }


    fitToCSG() {
        var layout = computeLayout(this.csg)
        this.layout = layout
            // TODO: optmize this
        this.box = computeLayout(this.csg)
    }

    fitToChildren(recursive = false) {

        if (this.children) {

            var xrange = {}
            var yrange = {}
            var zrange = {}
            xrange.min = _.min(this.children.map(function(c) {
                return c.box.location.x
            }))
            xrange.max = _.max(this.children.map(function(c) {
                return c.box.location.x + c.box.size.x
            }))
            yrange.min = _.min(this.children.map(function(c) {
                return c.box.location.y
            }))
            yrange.max = _.max(this.children.map(function(c) {
                return c.box.location.y + c.box.size.y
            }))
            zrange.min = _.min(this.children.map(function(c) {
                return c.box.location.z
            }))
            zrange.max = _.max(this.children.map(function(c) {
                return c.box.location.z + c.box.size.z
            }))

            // console.log(this.layout)

            // this.layout.size =
            var s = new Size(
                xrange.max - xrange.min,
                yrange.max - yrange.min,
                zrange.max - zrange.min
            )

            var p = new Location(
                xrange.min,
                yrange.min,
                zrange.min
            )

            this.layout = new Box(p, s)
            this.box = new Box(p, s)

            this.box.transform(this.m)
            this.layout.transform(this.m)
        }

        if (recursive && this.parent){
            this.parent.fitToChildren(true)
            //_fitToChildren_recursively_up(solid.parent)
        }
    }

    updateLayoutForAncestors() {
        if (this.parent){
            this.parent.fitToChildren()
            this.parent.updateLayoutForAncestors()
        }
    }
}


// compute a combined transformation matrix to an ancestor
function _compute_tm_from_to(solid, ancestor) {
    if (solid.parent && solid.parent === ancestor) {
        return {
            m: solid.m,
            n: solid.n
        }
    } else if (solid.parent) {
        var r = _compute_tm_from_to(solid.parent, ancestor)
        if (r)
            return {
                m: solid.m.multiply(r.m),
                n: r.n.multiply(solid.n)
            }
    }
}

function computeLayout(csg) {
    var b = csg.getBounds()
    var location = new Location(b[0].x, b[0].y, b[0].z)
    var size = new Size(b[1].x - b[0].x, b[1].y - b[0].y, b[1].z - b[0].z)
    return new Box(location, size)
}

//
// Transformation
//
import * as t from './transform'

function _wrap(func) {
    return function() {
        var loc = Location.from(arguments)
        var ret = func.call(this, loc)
        this.updateLayoutForAncestors()
        return ret
    }
}

Solid.prototype.transform = t.transform
Solid.prototype.transformAt = t.transformAt
Solid.prototype.translate = _wrap(t.translate)
Solid.prototype.translateTo = _wrap(t.translateTo)
Solid.prototype.centerAt = _wrap(t.centerAt)
Solid.prototype.scale = _wrap(t.scale)
Solid.prototype.scaleTo = _wrap(t.scaleTo)

Solid.prototype.rotate = t.rotate
Solid.prototype.mirror = t.mirror

function _xyz(func, prefix) {
    Solid.prototype[prefix + 'X'] = _.partial(func, 'x')
    Solid.prototype[prefix + 'Y'] = _.partial(func, 'y')
    Solid.prototype[prefix + 'Z'] = _.partial(func, 'z')
}

_xyz(t.rotate, 'rotate')
_xyz(t.mirror, 'mirror')

var addWith = require('with')
Solid.prototype.transformEval = function(code, params) {

    params = params || {}

    var methods = {
        translate: this.translate.bind(this),
        translateTo: this.translateTo.bind(this),
        scale: this.scale.bind(this),
        scaleTo: this.scaleTo.bind(this),
        centerAt: this.centerAt.bind(this),
        rotateX: this.rotateX.bind(this),
        rotateY: this.rotateY.bind(this),
        rotateZ: this.rotateZ.bind(this),
        mirrorY: this.mirrorY.bind(this),
        mirrorX: this.mirrorX.bind(this),
        mirrorZ: this.mirrorZ.bind(this),
        tighten: this.apply.bind(this)
    }
    var env = _.merge(methods, params)

    // this expression places ';' between valid methods
    var scode = code.replace(/(\))\s*(translate|rotate|tighten|scale|center|mirror)/g, '$1;$2')

    // Scoping: code has access to Global variables and env
    var withExpr = addWith('env', scode)
    var f = new Function('env', withExpr)
    f(env)
}

// deprecated
Solid.prototype.align = require('./align')

import layoutEval from './layout'
Solid.prototype.layoutEval = layoutEval

import apply from './apply'
Solid.prototype.apply = apply
