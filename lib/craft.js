var debug = function(){}

var $$$ = require('craft-scad'),
    _ = require('lodash')

var inspect = require('eyes').inspector()

var parse = require('./parse'),
    render = require('./render'),
    Scope = require('./scope')


function _transform_recursively(node, matrix) {
    if (node.csg) {
        node.csg = node.csg.transform(matrix)
    }
    node.children.forEach(function(c) {
        _transform_recursively(c, matrix)
    })
}




//
// e.g.,
//
// crop = {
//     x: [10, 10],
//     y: [0, 10],
//     z: [50, 0]
// }
function _crop(csg, crop) {

    var cb = csg.getBounds()
    var size = {
        x: cb[1].x - cb[0].x,
        y: cb[1].y - cb[0].y,
        z: cb[1].z - cb[0].z
    }

    // list to collect things to subtract
    var toSubtractList = []

    var dims = ['x', 'y', 'z']
    var sides = [0, 1]
    dims.forEach(function(dim) {

        sides.forEach(function(side) {

            var cropsize = size[dim] * Number(crop[dim][side]) / 100

            if (cropsize === 0) {
                return
            }

            var csize = {
                x: size.x,
                y: size.y,
                z: size.z
            }

            var ctran = {
                x: 0,
                y: 0,
                z: 0
            }

            csize[dim] = cropsize

            if (side === 1) {
                ctran[dim] = size[dim] - cropsize
            }

            var toSubtract = $$$.cube()
                .scale([csize.x, csize.y, csize.z])
                .translate([ctran.x, ctran.y, ctran.z])

            toSubtractList.push(toCrop)

        })

    })

    if (toSubtractList.length === 0) {

        // nothing to subtract, return as is
        return csg

    } else {

        var combined = $$$.union(toCropList).translate(cb[0])

        debug('perform [subtract]')
        var cropped = csg.subtract(combined)
        debug('done')
        return cropped
    }
}

function _applyTranformation(node, matrix) {


    if (_.isArray(node)) {

        node.forEach(function(x) {
            _applyTranformation(x)
        })

    } else {


        var m = matrix || $$$.CSG.Matrix4x4.unity()

        var loc = node.layout.location
        m = $$$.CSG.Matrix4x4.translation([loc.x, loc.y, loc.z]).multiply(m)

        if (node.layout.scale) {
            var s = node.layout.scale
            m = $$$.CSG.Matrix4x4.scaling([s.x, s.y, s.z]).multiply(m)
        }

        if (node.layout.rotate) {

            var r = node.layout.rotate            
            if (r.axis === 'x'){
                m = $$$.CSG.Matrix4x4.rotationX(r.degrees).multiply(m)    
            } else if (r.axis === 'y'){
                m = $$$.CSG.Matrix4x4.rotationY(r.degrees).multiply(m)    
            } else if (r.axis === 'z'){
                m = $$$.CSG.Matrix4x4.rotationZ(r.degrees).multiply(m)    
            }

            
        }

        if (node.type === 'solid') {
            var solid = node

            if (node.crop) {
                debug("%d polygons", solid.csg.polygons.length)
                solid.csg = _crop(node.csg, node.crop)
            }

            var cb = solid.csg.getBounds()

            // console.log('%d,%d,%d --> ', cb[0].x, cb[0].y, cb[0].z)
            // console.log('%d,%d,%d', solid.layout.x, solid.layout.y, solid.layout.z)

            //m = m.multiply($$$.CSG.Matrix4x4.translation([-cb[0].x, -cb[0].y, -cb[0].z]))
            m = $$$.CSG.Matrix4x4.translation([-cb[0].x, -cb[0].y, -cb[0].z]).multiply(m)

            solid.csg = solid.csg.transform(m)

        } else if (node.type === 'group') {

            node.children.forEach(function(c) {

                _applyTranformation(c, m)

            })
        }
    }

}

function _collect_csgs(arg) {

    var solids
    if (_.isArray(arg)) {
        solids = arg
    } else {
        solids = [arg]
    }

    var csgs = []
    solids.forEach(function(solid) {
        _collect_csgs_helper(solid, csgs)
    })

    return csgs
}

function _collect_csgs_helper(node, acc) {
    if (node.type === 'solid' && node.csg) {
        acc.push(node.csg)
    } else if (node.type === 'group') {
        node.children.forEach(function(s) {
            return _collect_csgs_helper(s, acc)
        })
    }
}

function _loadPrimitives() {
    return require('./primitives')
}

function _initScope() {
    return _loadPrimitives()
        .then(function(primitives) {

            var scope = new Scope()
            _.extend(scope, primitives)
            return scope
        })
}

function myunion1(csgs) {
    var all
    csgs.forEach(function(csg, i) {
        console.log('%d of %d, %d + %d', i + 1, csgs.length, all ? all.polygons.length : 0, csg.polygons.length)
        debug('%d of %d, %d + %d', i + 1, csgs.length, all ? all.polygons.length : 0, csg.polygons.length)
        if (i === 0) {
            all = csg
        } else {
            all = all.union(csg)
        }
    })
    return all
}

function myunion4(csgs) {
    var all
    csgs.forEach(function(csg, i) {
        console.log('%d of %d, %d + %d', i + 1, csgs.length, all ? all.polygons.length : 0, csg.polygons.length)
        debug('%d of %d, %d + %d', i + 1, csgs.length, all ? all.polygons.length : 0, csg.polygons.length)
        if (i === 0) {
            all = csg
        } else {
            all = all.unionForNonIntersecting(csg)
        }
    })
    return all
}


function myunion3(csgs) {

    // mayOverlap

    // compute bsp trees for all csgs
    debug('creating bsp trees')

    var ps = _.map(csgs, function(csg, i) {
        debug('%d of %d', i + 1, csgs.length)
        var t = new $$$.CSG.Tree(csg.polygons)

        return {
            csg: csg,
            bsp: t
        }

    })

    debug('clipping')

    // assume the bsp tree itself does not change, only the polygons change
    _.forEach(ps, function(p, i) {
        debug('%d of %d', i + 1, ps.length)

        // others
        _.forEach(ps.slice(i), function(other, j) {

            if (p !== other && p.csg.mayOverlap(other.csg)) {
                // console.log(true)

                p.bsp.clipTo(other.bsp, false)

                other.bsp.clipTo(p.bsp)
                other.bsp.invert()
                other.bsp.clipTo(p.bsp)
                other.bsp.invert()

            }

        })

    })

    debug('collecting polygons')

    var polygons = []
    _.forEach(ps, function(p, i) {
        debug('%d of %d', i + 1, ps.length)

        polygons = polygons.concat(p.bsp.allPolygons())
    })

    var result = $$$.CSG.fromPolygons(polygons)

    debug('retesselated')
    // result = result.reTesselated()
    debug('cannonicalized')
    // result = result.canonicalized()
    return result
}

// incorrect
function myunion2(csgs) {

    var all, polygons = []

    _.forEach(csgs, function(csg, i) {

        var t = new $$$.CSG.Tree(csg.polygons)

        if (i === 0) {

            all = t

        } else {

            all.clipTo(t)
            t.clipTo(all)
            t.invert()
            t.clipTo(all)
            t.invert()
        }

        polygons = polygons.concat(t.allPolygons())

        // compute bst trees
        debug('%d of %d, add %d polygons, total %d polygons', i + 1, csgs.length, csg.polygons.length, polygons.length)

    })

    // var a = new CSG.Tree(this.polygons);
    // var b = new CSG.Tree(csg.polygons);
    // a.clipTo(b, false);

    // b.clipTo(a, true); // ERROR: this doesn't work
    // b.clipTo(a);
    // b.invert();
    // b.clipTo(a);
    // b.invert();

    // var newpolygons = a.allPolygons().concat(b.allPolygons());
    var result = $$$.CSG.fromPolygons(polygons)
    return result
}

var _apply_union = myunion3


function preview(xml) {

    return _initScope()
        .then(function(scope) {
            return [parse(xml), scope]
        })
        .spread(function(parsed, scope) {
            console.time("rendering")
            return render(parsed.children, scope)
        })
        .then(function(solids) { 

            _applyTranformation(solids)

            var ret = {}
            ret.csgs = _collect_csgs(solids)
            console.timeEnd("rendering")

            return ret
        })
}

function build(xml) {

    return preview(xml)
        .then(function(previewble) {
            console.time("unioning")
            var csg = _apply_union(previewble.csgs)
            console.timeEnd("unioning")
            return csg
        })
}


module.exports = {
    build: build,
    preview: preview,
    _test: {
        _applyTransformation: _applyTranformation,
        _loadPrimitives: _loadPrimitives
    }
}