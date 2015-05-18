var _ = require('lodash'),
    parse = require('./parse'),
    render = require('./render'),
    Scope = require('./scope'),
    Solid = require('./solid'),
    _s = require('./solids'),
    Promise = require('bluebird')

function _loadPrimitives() {
    return require('./primitives')
}

function _initScope() {
    return _loadPrimitives()
        .then(function(primitives) {
            var scope = new Scope()
            scope.crafts = _.clone(primitives)
            return scope
        })
}

function _renderToSolids(xml, context) {
    return _initScope()
        .then(function(scope) {
            if (context && context.parameters){
                scope.parameters = context.parameters
            }
            return [parse(xml, context), scope]
        })
        .spread(function(parsed, scope) {
            console.time("rendering")

            var paramDefs =
                _(parsed.children)
                .filter({name: 'parameter'})
                .pluck('attribs')
                .value()

            return [render(parsed.children, scope), paramDefs]
        })
}

function preview(xml, context) {
    return _renderToSolids(xml, context)
        .spread(function(solids, paramDefs) {

            _s(solids).apply()

            // construct a viewable object
            var viewable = {}
            var csgs = _s(solids).csgs()

            viewable.csgs = csgs.map(function(csg) {
                return {
                    stl: '', //csg.toStlString(),
                    color: csg.color,
                    buffer: csg.toFloat32Array()
                }
            })

            // Benchmark
            // console.time('toStl')
            // csgs.forEach(function(csg){
            //     csg.toStlString()
            // })
            // console.timeEnd('toStl')
            //
            // console.time('toFloat32Array')
            // csgs.forEach(function(csg){
            //     csg.toFloat32Array()
            // })
            // console.timeEnd('toFloat32Array')

            if (solids.length > 0) {
                var s = solids[0]
                viewable.layout = s.layout
            }

            viewable.params = paramDefs
            console.timeEnd("rendering")
            return viewable
        })
}

function build(xml, context) {

    return _renderToSolids(xml, context)
        .spread(function(solids) {
            console.time("unioning")
            _s(solids).apply()
            var csg = _s(solids).union()
            console.timeEnd("unioning")
            return csg
        })
}


module.exports = {
    build: build,
    preview: preview,
    _test: {
        _loadPrimitives: _loadPrimitives
    }
}
