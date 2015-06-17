var _ = require('lodash'),
    parse = require('./parse'),
    render = require('./render'),
    Scope = require('./scope'),
    Solid = require('./solid'),
    _s = require('./solids'),
    Promise = require('bluebird')

function _loadPrimitives() {
    return require('./builtins')
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

            // construct a viewable object
            var viewable = {}

            viewable.params = paramDefs

            // create a root solid and set all the rendered solids as its children
            var s = new Solid()
            s.setChildren(solids)

            // mirror wrt y=0 in order to show the solid in the "screen"
            // perspective
            s.mirrorY(0)

            s.apply()

            viewable.layout = s.layout

            // collect csgs for viewing
            var csgs = _s(s.children).csgs()
            viewable.csgs = csgs.map(function(csg) {
                var ret = {
                    color: csg.color,
                    type: csg.properties.type
                }
                if (csg.properties.type == 'lines'){
                    ret.buffer = csg.toFloat32ArrayLines()
                } else {
                    ret.buffer = csg.toFloat32ArrayMesh()
                }
                return ret
            })

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
