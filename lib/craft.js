var $$$ = require('craft-scad'),
    _ = require('lodash')

var inspect = require('eyes').inspector()

var parse = require('./parse1'),
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

function _applyTranformation(node, matrix) {


    if (_.isArray(node)) {

        node.forEach(function(x) {
            _applyTranformation(x)
        })

    } else {

        var loc = node.layout.location
        var m = $$$.CSG.Matrix4x4.translation([loc.x, loc.y, loc.z])
        if (matrix) {
            m = m.multiply(matrix)
        }

        if (node.type === 'solid') {
            var solid = node
            var cb = solid.csg.getBounds()

            // console.log('%d,%d,%d --> ', cb[0].x, cb[0].y, cb[0].z)
            // console.log('%d,%d,%d', solid.layout.x, solid.layout.y, solid.layout.z)

            m = m.multiply($$$.CSG.Matrix4x4.translation([-cb[0].x, -cb[0].y, -cb[0].z]))
            solid.csg = solid.csg.transform(m)

            var cb = solid.csg.getBounds()

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

function build(node) {

    _applyTranformation(node)

    //b.solids = node

    // return b
}

module.exports = {
    build: build,
    preview: preview,
    _test: {
        _applyTransformation: _applyTranformation,
        _loadPrimitives: _loadPrimitives
    }
}