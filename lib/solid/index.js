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
            // this.box = new Box()
            var csg = arguments[0]
            this.csg = csg
            this.fitToCSG()

        } else if (arguments.length === 2) {
            // Solid(location, size)

            var o = arguments[0]
            var s = arguments[1]
            this.layout = new Box(o, s)
            // this.box = new Box(o, s)

        } else {

            this.layout = new Box()
            // this.box = new Box()
        }

        this.type = 'solid'
            // transformation matrix w.r.t. parent
        this.m = Matrix4x4.unity()
            // inverse transformation matrix for reverting
        // this.n = Matrix4x4.unity()

        this.style = {}
        this.flipped = false
        this.children = []
    }

    // create a solid from a group of solids
    static fromGroup(solids) {
        var grp = new Solid()
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
        // clone.n = this.n
        clone.layout = this.layout.clone()
        // clone.box = this.box.clone()
        clone.cropped = this.cropped
        clone.children = _.map(this.children, function(c) {
            let cc = c.clone()
            cc.parent = clone
            return cc
        })
        clone.color = this.color
        clone.style = _.clone(this.style)
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

    getMerged(){
        let [toMerge, els] = _.partition(this.children, (c) => {
            return c.type == 'merge'
        })
        _.remove(els, {type: 'define'})
        return _.flatten(_.map(toMerge, (c) => { return c.getMerged()} )).concat(els)
    }

    pp(levels = 0){

        let indent = _.repeat('  ',levels)
        let desc = `<${this.element.name}> role=${this.role}`
        if (this.role != 'define'){
            let [l, s] = [this.layout.location, this.layout.size]
            desc += `, location=(${l.x},${l.y},${l.z}), size=(${s.x},${s.y},${s.z})`
        }

        console.log(indent, desc)
        _.forEach(this.children, c =>{

            if (c.pp){
                c.pp(levels+1)
            } else {
                console.log('c.pp is not defined')
            }
        })
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
        // this.box = computeLayout(this.csg)
    }

    fitToChildren(recursive = false) {

        // return
        // var solids = this.getMerged()
        var solids = _.filter(this.children, (c) => {
                return c.role == 'group' || c.role =='csg'
        })
        // if (this.children) {
        if (solids.length > 0) {

            var xrange = {}
            var yrange = {}
            var zrange = {}
            xrange.min = _.min(solids.map(function(c) {
                return c.layout.location.x
            }))
            xrange.max = _.max(solids.map(function(c) {
                return c.layout.location.x + c.layout.size.x
            }))
            yrange.min = _.min(solids.map(function(c) {
                return c.layout.location.y
            }))
            yrange.max = _.max(solids.map(function(c) {
                return c.layout.location.y + c.layout.size.y
            }))
            zrange.min = _.min(solids.map(function(c) {
                return c.layout.location.z
            }))
            zrange.max = _.max(solids.map(function(c) {
                return c.layout.location.z + c.layout.size.z
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

            if (this.layout.c){
                // this.translate(p.x,p.y,p.z)
                this.layout.transformTo(p, s)
                // this.box.transformTo(p, s)//this.layout.location, s)

            } else {

                this.layout = new Box(p, s)
                // this.box = new Box(p, s)//Location(0,0,0), s)
                // this.translateTo(p.x,p.y,p.z)
            }

            // _.forEach(this.children, c => {
            //
            //     c.translate(-p.x,-p.y,-p.z)
            //
            // })
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
// IO
//

import * as io from './io'

Solid.prototype.save = io.save

//
// Transformation
//
import * as t from './transform'

function _wrap(func) {
    return function() {
        var loc = Location.from(arguments)
        var ret = func.call(this, loc)
        // this.updateLayoutForAncestors()
        return ret
    }
}

Solid.prototype.transform = t.transform
Solid.prototype.transformAt = t.transformAt
Solid.prototype.translate = _wrap(t.translate)
Solid.prototype.translateTo = _wrap(t.translateTo)
Solid.prototype.center = _wrap(t.center)
Solid.prototype.scale = _wrap(t.scale)
Solid.prototype.resize = _wrap(t.resize)
Solid.prototype.fit = _wrap(t.fit)

Solid.prototype.rotate = t.rotate
Solid.prototype.mirror = t.mirror
Solid.prototype.land = t.land
Solid.prototype.crop = t.crop
Solid.prototype.centerDim = t.centerDim
Solid.prototype.setDim = t.setDim
Solid.prototype.resizeDim = t.resizeDim

function _xyz(func, prefix) {
    Solid.prototype[prefix + 'X'] = _.partial(func, 'x')
    Solid.prototype[prefix + 'Y'] = _.partial(func, 'y')
    Solid.prototype[prefix + 'Z'] = _.partial(func, 'z')
}

_xyz(t.rotate, 'rotate')
_xyz(t.mirror, 'mirror')
_xyz(t.crop, 'crop')
_xyz(t.setDim, 'set')
_xyz(t.centerDim, 'center')
_xyz(t.resizeDim, 'resize')


import transformEval from './transformEval'

Solid.prototype.transformEval = transformEval

// deprecated
Solid.prototype.align = require('./align')

import layoutEval from './layout'
Solid.prototype.layoutEval = layoutEval

import apply from './apply'
Solid.prototype.apply = apply
