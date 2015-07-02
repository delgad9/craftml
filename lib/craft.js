var _ = require('lodash'),
    parse = require('./parse'),
    render = require('./render'),
    meta = require('./meta'),
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
        .then(function(solids){

            var s = solids[0]

            // mirror wrt y=0 in order to show the solid in the "screen" perspective
            s.mirrorY(0)
            s.apply()
            return s
        })

}

// replace the outter most <craft> with <g>
// <craft> ... </craft> ---> <g> ... </g>
function _preprocess(xml){

    var xml1 = xml.trim()
    var reg = new RegExp('<craft((.|[\r\n])*)\/craft>')
    xml1 = xml1.replace(reg, '<g$1/g>')
    // console.log(xml1)
    return xml1
}


// take a solid and get rid of unnecessary fields
function _prepare_viewable_solid(solid){

    if (solid.csg) {
        var csg = solid.csg
        if (csg.properties.type == 'lines') {
            solid.buffer = csg.toFloat32ArrayLines()
        } else {
            solid.buffer = csg.toFloat32ArrayMesh()
        }
        delete solid.csg
    }

    // delete fields not necessary for previewing
    delete solid.box
    delete solid.m
    delete solid.n
    delete solid.parent
    delete solid.layout.c

    _.forEach(solid.children, function(c){
        _prepare_viewable_solid(c)
    })
}

function preview(xml, context) {

    return Promise.join(
            _toSolid(xml, context),
            meta(xml))
        .spread(function(solid, meta) {
            // construct a viewable object
            var viewable = {}

            _prepare_viewable_solid(solid)

            viewable.root = solid
            viewable.meta = meta

            console.timeEnd("rendering")
            return viewable
        })
}

function build(xml, context) {

    return _toSolid(xml, context)
        .then(function(solid) {
            console.time("unioning")
            // console.log(solid)
            var csg = _s(solid.children).union()
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
