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

            var xml1 = _preprocess(xml)

            return [parse(xml1, context), scope]
        })
        .spread(function(parsed, scope) {
            console.time("rendering")

            var paramDefs =
                _(parsed.children)
                .filter({name: 'parameter'})
                .pluck('attribs')
                .value()

            return [render(parsed, scope), paramDefs]
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


function _prepare_viewable(solid){


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
        _prepare_viewable(c)
    })
}

function preview(xml, context) {
    return _renderToSolids(xml, context)
        .spread(function(solids, paramDefs) {

            // construct a viewable object
            var viewable = {}

            viewable.params = paramDefs

            // by making the top node a <g>, we know we will be getting
            // exactly ONE solid from _renderToSolids
            var s = solids[0]

            // mirror wrt y=0 to show the solid in the "screen" perspective
            s.mirrorY(0)

            s.apply()

            viewable.layout = s.layout

            _prepare_viewable(s)

            viewable.root = s

            console.timeEnd("rendering")
            return viewable
        })
}

function build(xml, context) {

    return _renderToSolids(xml, context)
        .spread(function(solids) {
            console.time("unioning")

            var s = solids[0]//new Solid()

            // mirror wrt y=0 in order to show the solid in the "screen"
            // perspective
            s.mirrorY(0)

            s.apply()

            var csg = _s(s.children).union()
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
