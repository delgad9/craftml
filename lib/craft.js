var debug = function() {}

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



function _applyCrop(node) {
    if (node.layout.crop.csg)
        _crop_recursively(node, node.layout.crop.csg)
}

function _crop_recursively(node, toCrop){
    if (node.csg){
        node.csg = node.csg.subtract(toCrop)
    }

    if (node.children){
        node.children.forEach(function(c){
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

            var c = ['x','y','z'].map(function(dim){
                return - node.layout.location[dim] - node.layout.size[dim]/2
            })

            var d = ['x','y','z'].map(function(dim){
                return node.layout.location[dim] + node.layout.size[dim]/2
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

        if (node.type === 'solid') {
            var solid = node

            if (solid.csg){
                var cb = solid.csg.getBounds()
                m = $$$.CSG.Matrix4x4.translation([-cb[0].x, -cb[0].y, -cb[0].z]).multiply(m)
                solid.csg = solid.csg.transform(m)
            }

        } else if (node.type === 'group') {

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

    if (node.csg){
        acc.push(node.csg)
    }

    // if (node.type === 'solid' && node.csg) {
    //     acc.push(node.csg)
    // } else 
    if (node.type === 'group') {
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
            scope.crafts = primitives
            // _.extend(scope, primitives)
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


function preview(xml, context) {

    return _initScope()
        .then(function(scope) {
            return [parse(xml, context), scope]
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

function build(xml, context) {

    return preview(xml, context)
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