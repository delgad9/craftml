export default function create(solid){

    return function(arg){

        if (_.isString(arg)){

            // arg is a selector
            let root = findRoot(solid)

            return (new Query(root)).find(arg)

        } else {

            // arg is an element

            return new Query(arg)

        }

    }
}

function findRoot(p){
    if (p.parent){
        return findRoot(p.parent)
    } else {
        return p
    }
}

import CSSselect from 'css-select'
import _ from 'lodash'

class Query {

    constructor(target){
        // this.target = target
        this.selection = [target]
    }

    css(key, value){

        _.forEach(this.selection, e => {
            e.setStyle(key, value)
        })

        // this.target.setStyle(key, value)
    }

    // root(){
    //     this.target = findRoot(this.target)
    //
    //     function findRoot(p){
    //         if (p.parent){
    //             return findRoot(p.parent)
    //         } else {
    //             return p
    //         }
    //     }
    //
    //     return this
    // }

    find(selector){

        let el = this.selection[0]

        let ret = CSSselect(selector, el)
        this.selection = ret
        return this
    }

    each(func){

        _.forEach(this.selection, (el, i) => {

            func.call(el, i, el)

        })

    }

}
