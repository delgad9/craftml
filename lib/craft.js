var _ = require('lodash'),
    parse = require('./parse'),
    render = require('./render'),
    Scope = require('./scope'),
    Solid = require('./solid'),
    _s = require('./solids')

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
            return [parse(xml, context), scope]
        })
        .spread(function(parsed, scope) {
            console.time("rendering")
            return render(parsed.children, scope)
        })
}

function preview(xml, context) {

    return _renderToSolids(xml, context)
        .then(function(solids) {

            _s(solids).apply()

            // construct a viewable object
            var viewable = {}
            var csgs = _s(solids).csgs()
            viewable.csgs = csgs.map(function(csg) {
                return {
                    stl: csg.toStlString()
                }
            })
            if (solids.length > 0) {
                var s = solids[0]
                viewable.layout = s.layout
            }
            console.timeEnd("rendering")
            return viewable
        })
}

function build(xml, context) {

    return _renderToSolids(xml, context)
        .then(function(solids) {
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
