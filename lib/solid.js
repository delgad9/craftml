var _ = require('lodash'),
    Matrix4x4 = require('./scad/geometry/Matrix4x4'),
    Location = require('./location'),
    Box = require('./box'),
    Size = require('./size')

module.exports = Solid

function Solid() {

    if (arguments.length === 1){
        // Solid(csg)
        this.layout = new Box()
        this.box = new Box()
        var csg = arguments[0]
        this.csg = csg
        this.fitToCSG()

    } else if (arguments.length === 2){
        // Solid(location, size)

        var o = arguments[0]
        var s = arguments[1]
        this.layout = new Box(o,s)
        this.box = new Box(o,s)

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
    if (this.csg){
        var clone = new Solid(this.csg)
    } else {
        var clone = new Solid()
    }
    clone.type = this.type
    clone.m = this.m
    clone.n = this.n
    clone.layout = this.layout.clone()
    clone.box = this.box.clone()
    clone.children = _.map(this.children, function(c){
        return c.clone()
    })
    clone.color = this.color
    return clone
}

Solid.prototype.fitToCSG = function() {
    var layout = computeLayout(this.csg)
    this.layout = layout
    // TODO: optmize this
    this.box = computeLayout(this.csg)
}

function computeLayout(csg) {
    var b = csg.getBounds()
    var location = new Location(b[0].x,b[0].y,b[0].z)
    var size = new Size(b[1].x-b[0].x,b[1].y-b[0].y,b[1].z-b[0].z)
    return new Box(location,size)
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

function _compute_tm_from_to_1(solid, ancestor){
    if (solid.parent && solid.parent === ancestor){
        return {m: solid.m, n: solid.n}
    } else if (solid.parent){
        var r = _compute_tm_from_to_1(solid.parent, ancestor)
        if (r)
            return {m: r.m.multiply(solid.m), n: solid.n.multiply(r.n)}
    }
}

// Convert the layout box to the coordinate system of
// a destination solid. The destination solid must be
// an ancestor of this solid

Solid.prototype.convertCoordinateTo = function(ancestor){

    if (ancestor === this){
        // do nothing, since ancestor can not be itself
        return
    }

    if (this.layout_reference){

        if (ancestor === this){

            // reset
            var r = _compute_tm_from_to(this.parent, this.layout_reference)
            this.layout.transform_apply(r.n)
            delete this.layout_reference

        } else {

            var pr = _compute_tm_from_to(this.parent, ancestor)
            var qr = _compute_tm_from_to(this.parent, this.layout_reference)

            if (qr){
                this.layout.transform(qr.n)
            }
            if (pr){
                this.layout.transform(pr.m)
            }
            this.layout_reference = ancestor
        }

    } else {

        var r = _compute_tm_from_to(this.parent, ancestor)
        if (r){
            this.layout.transform(r.m)
            this.layout_reference = ancestor
        }
    }
}

Solid.prototype.fitToChildren = function() {

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
}

//
// Transformation
//

function _parse_arguments_to_location(arguments){
    var loc
    if (arguments.length >= 3){
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
    return loc
}

function _location_partial(func){
    return function(){

        var loc = _parse_arguments_to_location(arguments)

        var ret = func.apply(this, [loc])

        _fitToChildren_recursively_up(this)

        return ret
    }
}

function _fitToChildren_recursively_up(solid){
    if (solid.parent){
        solid.parent.fitToChildren()
        _fitToChildren_recursively_up(solid.parent)
    }
}

function translate(loc){
    // update transformation matrix

    var tm = Matrix4x4.translation([loc.x, loc.y, loc.z])
    var tn = Matrix4x4.translation([-loc.x, -loc.y, -loc.z])

    this.transform(tm, tn)
}

Solid.prototype.transform = function(tm, tn){
    // update layout
    this.layout.transform(tm)

    // if the layout is referening to another node's coordinte system
    if (this.layout_reference){
        var r = _compute_tm_from_to(this.parent, this.layout_reference)
        tm = r.m.multiply(tm).multiply(r.n)
        tn = r.m.multiply(tn).multiply(r.n)
    }

    this.m = this.m.multiply(tm)
    this.n = tn.multiply(this.n)

    this.box.transform(tm)
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

    var tm = Matrix4x4.scaling([s.x, s.y, s.z])
    var tn = Matrix4x4.scaling([1/s.x, 1/s.y, 1/s.z])
    this.transform(tm, tn)

    this.translateTo(savedLoc)
}

function translate_group(loc, ancestor){

    var tm = Matrix4x4.translation([loc.x, loc.y, loc.z])
    var tn = Matrix4x4.translation([-loc.x, -loc.y, -loc.z])

    // update layout
    this.layout.transform(tm)

    if (this.layout_reference){
        var r = _compute_tm_from_to(this.parent, this.layout_reference)
        tm = r.m.multiply(tm).multiply(r.n)
        tn = r.m.multiply(tn).multiply(r.n)
    }

    // console.log('m*tm*1m*2m', JSON.stringify(this.m.multiply(tm).multiply(this.parent.m).multiply(this.parent.parent.m)))

    //
    // M * TM * M1 * M2 == M * M1 * M2 * P
    // TM * M1 * M2 == M1 * M2 * P
    // M1^ * TM * M1 * M2 == M2 * P
    // M2^ * M1^ * TM * M1 * M2 == P

    // compute a combined transformation matrix to an ancestor
    function _compute_tm_from_to_root(solid){
        if (solid.parent){
            var r = _compute_tm_from_to_root(solid.parent)
            return {m: solid.m.multiply(r.m), n: r.n.multiply(solid.n)}
        } else {
            return {m: solid.m, n:solid.n}
        }
    }

    function _compute_tm_from_to_root_reverse(solid){
        if (solid.parent){
            var r = _compute_tm_from_to_root_reverse(solid.parent)
            return {m: r.m.multiply(solid.m), n: solid.n.multiply(r.n)}
        } else {
            return {m: solid.m, n:solid.n}
        }
    }

    var pr = _compute_tm_from_to_root(this.parent)
    var qr = _compute_tm_from_to_root_reverse(this.parent)

    // console.log('pr', JSON.stringify(pr))
    // console.log('qr', JSON.stringify(qr))

    var p = pr.n.multiply(tm).multiply(pr.m)
    var q = qr.m.multiply(tn).multiply(qr.n)

    // console.log('p', JSON.stringify(p), JSON.stringify(qr.n.multiply(tm).multiply(pr.m)))
    // console.log('q', JSON.stringify(q), JSON.stringify(pr.m.multiply(tn).multiply(qr.n)))

    function find_root(solid){
        if (solid.parent.parent){
            return find_root(solid.parent)
        } else {
            return solid
        }
    }

    var root = find_root(this)
    root.m = root.m.multiply(p)
    root.n = q.multiply(root.n)
    root.layout.transform(p)
}

function TransformSelectedOp(solid, descendent){
    this.solid = solid
    this.descendent = descendent
}

TransformSelectedOp.prototype.translate = function(){
    var loc = _parse_arguments_to_location(arguments)
    translate_group.apply(this.descendent, [loc, this.solid])
    _fitToChildren_recursively_up(this.descendent)
}

// Select a descendent as the
Solid.prototype.select = function(descendent){
    // if selector is a Solid
    return new TransformSelectedOp(this, descendent)
}

function translateTo(loc){

    // update transformation matrix
    var d = {}
    _.forEach(loc, function(v, dim){
        d[dim] = v - this.layout.location[dim]
    }, this)

    var tm = Matrix4x4.translation([d.x, d.y, d.z])
    var tn = Matrix4x4.translation([-d.x, -d.y, -d.z])
    this.transform(tm, tn)
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
            var d = {
                x: - point[0],
                y: - point[1],
                z: - point[2]
            }
        }else {
            var d = {
                x: - point.x,
                y: - point.y,
                z: - point.z
            }
        }
    } else {
        // w.r.t. center
        var s = this.layout.size
        var o = this.layout.location
        var d = {
            x: - (s.x / 2) - o.x,
            y: - (s.y / 2) - o.y,
            z: - (s.z / 2) - o.z
        }
    }

    var Rm = Matrix4x4['rotation' + axis.toUpperCase()](degrees)
    var Tm = Matrix4x4.translation([d.x,d.y,d.z])
    var Tn = Matrix4x4.translation([-d.x,-d.y,-d.z])
    var Rn = Matrix4x4['rotation' + axis.toUpperCase()](-degrees)

    var tm = Tm.multiply(Rm).multiply(Tn)
    var tn = Tm.multiply(Rn).multiply(Tn)

    this.transform(tm, tn)

    // TODO: DRY
    _fitToChildren_recursively_up(this)
}

Solid.prototype.translate = _location_partial(translate)
Solid.prototype.translate_group = _location_partial(translate_group)
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

        var m = matrix || Matrix4x4.unity()

        if (solid.m) {
            m = solid.m.multiply(m)
            solid.m = Matrix4x4.unity()
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

Solid.prototype.fitToChildren1 = Solid.prototype.fitToChildren
