var _ = require('lodash'),
    inspect = require('eyes').inspector()

var parse = require('./parse'),
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
            _s(solids).apply()
            console.timeEnd("rendering")
            return solids
        })
}

function build(xml, context) {

    return preview(xml, context)
        .then(function(solids) {
            console.time("unioning")
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