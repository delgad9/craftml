var select = require('../render/select'),
    _ = require('lodash'),
    addWith = require('with')

function align(solids, references, dim, v){

    var m
    if (m = v.trim().match(/(-?\d+)%/)){
        v = Number(m[1])
    } else {
        v = 0
    }

    var o   // bounds of the first solid
    solids.forEach(function(solid,i) {
        var ref = references[i]
        if (i == 0){

            o = ref.layout

        } else {

            var d = {x:0, y:0, z:0}
            var percent = v


            // (o + o.s * p) - (r + r.s * p)
            //
            d[dim] = o.location[dim] +
                    (o.size[dim] - ref.layout.size[dim]) * percent / 100
                    - ref.layout.location[dim]
            // console.log(solid, ref)
            solid.transformAt(ref).translate(d.x,d.y,d.z)
        }
    })
}

function center(solids, references, dim){
    align(solids, references, dim, '50%')
}


function distribute(solids, references, dim){

    if (solids.length <= 2){
        return
    }

    // sort solids by the target dim

    var z = _.zip(solids, references)
    var sorted = _.sortBy(z, function(e){
        return e[0].layout[dim]
    })


    var uz = _.unzip(sorted)
    var sortedSolids = uz[0]
    var sortedReferences = uz[1]


    var totalSize =
        _.sum(_.map(solids, function(solid){
            return solid.layout.size[dim]
        }))


    var n = solids.length
    var last = _.last(sortedSolids)
    var first = sortedSolids[0]

    var max = last.layout.location[dim] + last.layout.size[dim]


    var availableSpace = last.layout.location[dim] + last.layout.size[dim]
        - first.layout.location[dim]

    var spacing = (availableSpace - totalSize) / (n - 1)

    lineup(sortedSolids, sortedReferences, dim, spacing, '+')

}

function lineup(solids, references, dim, spacing, direction){

    var iter
    if (direction == '-'){
        iter = _.forEachRight
    } else {
        iter = _.forEach
    }

    spacing = Number(spacing)

    // get the spacing of the i-th gap
    // if there are fewer elements in 'spacing' than i
    // return the last element
    function get_spacing(i){
        if (_.isArray(spacing)){
            if (i >= spacing.length){
                return spacing[spacing.length-1]
            } else {
                return spacing[i]
            }
        } else {
            return spacing
        }
    }

    var d
    iter(solids, function(solid, i) {
        var ref = references[i]

        if (_.isUndefined(d)){
            d = ref.layout.location[dim]
        } else {
            var delta = {x:0, y:0, z:0}
            delta[dim] = d - ref.layout.location[dim]
            solid.transformAt(ref).translate(delta)
        }
        d = d + ref.layout.size[dim] + get_spacing(i)
    })
}

function _parse(code){

    var exprs = code.match(/\s*((select|lineup|align|center|distribute)[XYZ]*)\(.*?\)\s*/g)

    return _.map(exprs, function(expr){
        var m = expr.match(/(.+)\((.*)\)/)
        return {name: m[1].trim(),
                args: m[2].trim().split(' ')
            }
        })
}

module.exports = function layout(code, params){

    params = params || {}

    var ops = _parse(code)

    var solids = this.children
    var selected = solids
    var references = selected

    function applyMultipleAxes(func, dims){

        var rest = _.toArray(arguments).slice(2)

        // console.log('rest', arguments[1], rest)

        _.forEach(dims.split(''), function(dim){

            var p = _.partial(func, selected, references, dim)
            p.apply(this, rest)

        })
    }

    var methods = {
        select : function(){

            var selectors = _.toArray(arguments)

            if (selectors.length === 1 && selectors[0] === '') {

                selected = []
                references = []

            } else if (selectors.length === 1 && selectors[0] === '*'){

                selected = solids
                references = solids

            } else {

                // extract indices
                //
                // ["1" "5@foo" "7"]
                //
                // -->
                //
                // is === [1, 5, 7]
                //
                // childSelectors === ['', 'foo', '']

                var is = [], childSelectors = []

                _.forEach(selectors, function(tok){

                    var m = tok.match(/(-?\d*)(@(.*))?/)
                    if (m && m[1]){
                        var i = Number(m[1]) - 1
                        var childSelector = m[3]
                        is.push(i)
                        childSelectors.push(childSelector)
                    }
                })

                selected = []
                references = []

                _.forEach(is, function(i, index){

                    if (i >= 0 && i < solids.length){


                        var solid = solids[i]
                        selected.push(solid)


                        var reference = solid
                        var selector = childSelectors[index]

                        // find ref
                        if (selector){
                            var matches = solid.find(selector)
                            // console.log('matches:', selector, matches)
                            if (matches.length > 0) {
                                // if found
                                var descendent = matches[0]
                                descendent.convertCoordinateTo(solid.parent)
                                reference = descendent
                            }
                        }

                        references.push(reference)
                    }
                })

            }
        }
    }

    function add(func, dims){
        methods[func.name + dims.toUpperCase()] =
            _.partial(applyMultipleAxes, func, dims)
    }

    var funcs = [align, lineup, center, distribute]
    var dimss = ['x','y','z','xy','xz','yz','xyz']
    _.forEach(funcs, function(func){
        _.forEach(dimss, function(dims){
            add(func, dims)
        })
    })

    _.forEach(ops, function(op){
        var f = methods[op.name]
        if (f)
            f.apply(this, op.args)
    })

}
