var debug = require('debug')('craft.main')

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
            m = $$$.CSG.Matrix4x4.scaling(s).multiply(m)
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

function preview(xml) {

    var parsed = parse(xml)
        // inspect(parsed)

    var primitives = _loadPrimitives()
        // inspect(primitives)

    var scope = new Scope()
    _.extend(scope, primitives)

    var solids = render(parsed.children, scope)
        // inspect(solids)

    _applyTranformation(solids)

    var ret = {}
    ret.csgs = _collect_csgs(solids)
    return ret
}

function build(xml) {

    var parsed = parse(xml)
        // inspect(parsed)

    var primitives = _loadPrimitives()
        // inspect(primitives)

    var scope = new Scope()
    _.extend(scope, primitives)

    var solids = render(parsed.children, scope)
        // inspect(solids)

    _applyTranformation(solids)

    var ret = {}
    var csgs = _collect_csgs(solids)

    return $$$.union(csgs)
}

module.exports = {
    build: build,
    preview: preview,
    _test: {
        _applyTransformation: _applyTranformation,
        _loadPrimitives: _loadPrimitives
    }
}