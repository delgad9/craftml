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
            d[dim] = o.position[dim] +
                    (o.size[dim] - ref.layout.size[dim]) * percent / 100
                    - ref.layout.position[dim]
            // console.log(solid, ref)
            // solid.transformAt(ref).translate(d.x,d.y,d.z)
            solid.translate(d.x,d.y,d.z)
        }
    })
}

function center(solids, references, dim){
    align(solids, references, dim, '50%')
}

function wrap(solids, references, dim, length) {

    // console.log(length)
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

    var max = last.layout.position[dim] + last.layout.size[dim]


    var availableSpace = last.layout.position[dim] + last.layout.size[dim]
        - first.layout.position[dim]

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
            d = ref.layout.position[dim]
        } else {
            var delta = {x:0, y:0, z:0}
            delta[dim] = d - ref.layout.position[dim]
            solid.translate(delta)
        }
        d = d + ref.layout.size[dim] + get_spacing(i)
    })
}

function _parse(code){

    var exprs = code.match(/\s*((select|lineup|align|center|distribute|reverse|cut)[XYZ]*)\(.*?\)\s*/g)

    return _.map(exprs, function(expr){
        var m = expr.match(/(.+)\((.*)\)/)
        return {name: m[1].trim(),
                args: m[2].trim().split(' ')
            }
        })
}

import q from '../query'
import union from './union'

function cut(solids, selectors){
    let $ = q(this)

    // console.log('cut', selectors)
    // this.pp()

    let csgsToCut = []
    let csgsToCutFrom = []

    $(this).find(selectors + ' csg').each(function(){
        csgsToCut.push(this)
    })

    let elementsToCut = []
    $(this).find(selectors).each(function(){
        elementsToCut.push(this)
    })

    let elementsToCutFrom = _.difference(solids, elementsToCut)

    _.forEach(elementsToCutFrom, s => {

        $(s).find('csg').each(function(){
            csgsToCutFrom.push(this)
        })

    })

    // console.log('toCutFrom', _.pluck(csgsToCutFrom,'parent.parent.name'))
    // console.log('toCut', _.pluck(csgsToCut,'parent.parent.name'))
    // console.log('cut', csgsToCut.length, 'from', csgsToCutFrom.length)
    // console.log('toCutFrom', _.pluck(elementsToCutFrom,'name'))

    this.apply()

    // console.log(csgsToCut.length)
    // console.log(csgsToCutFrom.length)
    var csg0 = union(_.pluck(csgsToCut,'csg'))
    var csg1 = union(_.pluck(csgsToCutFrom,'csg'))

    // console.log(csg0.polygons.length)
    // console.log(csg1.polygons.length)

    var csg = csg1.subtract(csg0)

    //let rest = _.difference(this.children, _.union(solids, elementsToCut))
    let rest = _.difference(this.children, elementsToCutFrom)

    this.removeAll()
    this.add(csg)
    _.forEach(rest, r => {
        this.add(r)
    })
    _.forEach(csgsToCut, r => {
        r.role = 'cut'
    })
}

export default function layout(code, params){

    let $ = q(this)

    params = params || {}

    var ops = _parse(code)

    // var solids = this.children

    var solids = _.filter(this.children, (c) => {
            return (c.role == 'group' || c.role =='csg') &&
                (c.layout.size.x > 0 || c.layout.size.y > 0 || c.layout.size.z > 0)
    })

    // console.log('code', code, _.pluck(this.children,'element.name'), _.pluck(solids,'element.name'))

    var selected = solids.slice(0)
    var references = selected.slice(0)

    function applyMultipleAxes(func, dims){

        var rest = _.toArray(arguments).slice(2)

        // console.log('rest', arguments[1], rest)

        _.forEach(dims.split(''), function(dim){

            var p = _.partial(func, selected, references, dim)
            p.apply(this, rest)

        })
    }

    var methods = {

        reverse : function(){
            // console.log(selected)
            selected.reverse()
            references.reverse()
        },


        select : function(){

            var selectors = _.toArray(arguments)

            if (selectors.length === 1 && selectors[0] === '') {

                selected.length = 0// = []
                references = []

            } else if (selectors.length === 1 && selectors[0] === '*'){

                selected = solids
                references = solids

            } else {

                //
                // selectors === ["1" ".foo" "7"]
                //

                selected.length = 0

                _.forEach(selectors, tok => {

                    // console.log('tok',tok)

                    if (Number(tok)){

                        let i = Number(tok) // one-based

                        let c = solids[i-1]

                        selected.push(c)

                    } else {

                        $(this).find(tok).each(function(){

                            selected.push(this)

                        })

                    }

                })


                if (0){
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

                    selected.length = 0// = []
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

                    // console.log(_.pluck(selected,'name'))
                }

            }
        }
    }

    // let solid = this
    // function apply(func){
    //     var rest = _.toArray(arguments).slice(2)
    //     func.apply(solid, selected)
    // }

    methods['cut'] = _.partial(cut, selected)

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

    _.forEach(ops, op => {
        var f = methods[op.name]
        if (f)
            f.apply(this, op.args)
    })

    this.selected = selected
    this.fitToChildren()
}
