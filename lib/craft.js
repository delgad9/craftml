var _ = require('lodash'),
    parse = require('./parse'),
    render = require('./render'),
    meta = require('./meta'),
    Scope = require('./scope'),
    Solid = require('./solid'),
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

function _toSolid(xml, context) {
    return _initScope()
        .then(function(scope) {

            if (context && context.parameters){
                scope.parameters = context.parameters
            }

            var xml1 = _preprocess(xml)
            return parse(xml1, context)
                .then(function(parsed){
                    console.time("rendering")
                    return render(parsed, scope)
                })
        })
        .then(function(solid){
            // var s = solids[0]
            // mirror wrt y=0 in order to show the solid in the "screen" perspective
            solid.mirrorY(0)
            // solid.mirrorX(0)
            // solid.pp()
            return solid
        })

}

var cssText = require('./css/default.css.js')

// replace the outter most <craft> with <g>
// <craft> ... </craft> ---> <g> ... </g>
function _preprocess(xml){

    var xml1 = xml.trim()
    var reg = new RegExp('<craft((.|[\r\n])*)\/craft>')
    xml1 = xml1.replace(reg, '<g><style>' + cssText + '</style><g$1/g></g>')
    // xml1 = xml1.replace(reg, '<g$1/g></g>')
    return xml1
}

function preview(xml, context) {

    return Promise.join(
            _toSolid(xml, context),
            meta(xml))
        .spread(function(solid, meta) {
            // construct a viewable object
            var viewable = {}

            // console.time('preparing')
            // _prepare_viewable_solid(solid, null, false)
            // console.timeEnd('preparing')

            viewable.root = solid.preview()
            viewable.meta = meta

            console.timeEnd("rendering")
            return viewable
        })
}

function build(xml, context) {

    return _toSolid(xml, context)
        .then(function(solid) {
            console.time("compiling")
            var csg = solid.compile()
            console.timeEnd("compiling")
            return csg
        })
}

function preview1(xml, context) {
    return _toSolid(xml, context)
}

module.exports = {
    build: build,
    preview: preview,
    preview1: preview1,
    _test: {
        _loadPrimitives: _loadPrimitives
    }
}
