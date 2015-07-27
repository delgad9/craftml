import _ from 'lodash'

import align from './align'
import distribute from './distribute'
import lineup from './lineup'
import center from './center'
import cut from './cut'

import q from '../../query'

const xyzMethods = [align, lineup, center, distribute]
const twoGroupsMethods = [cut]

export default function layoutEval(code){

    var ops = parse_layout_commands(code)

    var solids = _.filter(this.children, (c) => {
            return ((c.role == 'group' || c.role =='csg') &&
                (c.size.x > 0 || c.size.y > 0 || c.size.z > 0))
                    || (c.role == '1d')
    })

    let SS = new LayoutOperation(this, solids)
    _.forEach(ops, op => {
        var f = SS[op.name]
        if (f)
            f.apply(SS, op.args)
    })
    this.fitToChildren()
}

function parse_layout_commands(code){

    var exprs = code.match(/\s*((select|lineup|align|center|distribute|reverse|cut)[XYZ]*)\(.*?\)\s*/g)

    return _.map(exprs, function(expr){
        var m = expr.match(/(.+)\((.*)\)/)
        return {name: m[1].trim(),
                args: m[2].trim().split(' ')
            }
        })
}

class LayoutOperation {

    constructor($solid, solids){
        this.$solid = $solid
        this.solids = solids
        this.selected = solids

        addXYZMethodHelper(this)
        addTwoGroupsMethodHelper(this)
    }

    select(){

        let $ = q(this.$solid)

        var selectors = _.toArray(arguments)

        if (selectors.length === 1 && selectors[0] === '') {

            this.selected.length = 0

        } else if (selectors.length === 1 && selectors[0] === '*'){

            this.selected = this.solids

        } else {

            //
            // selectors === ["1" ".foo" "7"]
            //

            this.$solid.apply()
            this.selected = []
            _.forEach(selectors, tok => {

                if (Number(tok)){

                    let i = Number(tok) // one-based

                    let c = this.solids[i-1]

                    this.selected.push(c)

                } else {

                    // console.log(_.pluck(this.selected,'name'))

                    _.forEach(this.$solid.children, c => {

                        // first, test if c matches the selector
                        if ($(c).is(tok)){
                            // console.log('select a child')
                            this.selected.push(c)

                        } else {
                        // if not, find something that matches in its descendents

                            let e = $(c).find(tok).get()[0]
                            if (e){
                                // console.log('select a descendent')
                                let ts = c.transform
                                e.transform = function(m){
                                    // console.log('transform intercepted')
                                    c.transform(m)
                                }
                                this.selected.push(e)
                            }
                        }

                    })

                }
            })
        }
    }

    reverse(){
        this.selected.reverse()
    }
}

function addTwoGroupsMethodHelper(SS){

    let solid = SS.$solid
    let $ = q(solid)

    function applyToAnotherGroup(func, selectors){

        // console.log(this)
        solid.apply()

        let group1 = this.selected
        let group2 = []

        $(solid).find(selectors).each(function(){
            group2.push(this)
        })
        // console.log('1:', group1.length, '2:', group2.length)
        func.call(this, this.$solid, group1, group2)
    }

    _.forEach(twoGroupsMethods, func => {
        let methodName = func.name
        SS[methodName] = _.partial(applyToAnotherGroup, func)
    })
}

function addXYZMethodHelper(SS){

    function applyMultipleAxes(func, dims, ...rest){
        _.forEach(dims.split(''), dim => {
            // console.log(this.selected.length)
            func.call(this, this.selected, dim, ...rest)
        })
    }

    function add(func, dims){
        let methodName = func.name + dims.toUpperCase()
        SS[methodName] = _.partial(applyMultipleAxes, func, dims)
    }


    var dimss = ['x','y','z','xy','xz','yz','xyz']
    _.forEach(xyzMethods, function(func){
        _.forEach(dimss, function(dims){
            add(func, dims)
        })
    })
}
