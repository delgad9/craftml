import _ from 'lodash'

import align from './align'
import distribute from './distribute'
import lineup from './lineup'
import center from './center'
import cut from './cut'

import q from '../../query'

function _parse(code){

    var exprs = code.match(/\s*((select|lineup|align|center|distribute|reverse|cut)[XYZ]*)\(.*?\)\s*/g)

    return _.map(exprs, function(expr){
        var m = expr.match(/(.+)\((.*)\)/)
        return {name: m[1].trim(),
                args: m[2].trim().split(' ')
            }
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
