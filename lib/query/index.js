import chai from 'chai'

export default function create(solid){

    return function(arg){

        if (_.isString(arg)){

            // arg is a selector

            return (new Query(solid)).find(arg)

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

    get should() {
        return chai.expect(this.selection)
    }

    get length(){
        return this.selection.length
    }

    is(selector){
        return _.some(this.selection, s => {
            return CSSselect.is(s, selector)
        })
    }

    find(selector){

        let el = this.selection[0]

        let ret = CSSselect(selector, el)
        this.selection = ret
        return this
    }

    get(i = -1){
        if (i >= 0){
            return this.selection[i]
        } else {
            return this.selection
        }
    }

    // Gets the previous sibling of the first selected element optionally
    // filtered by a selector.
    prev(selector){
        let prev = this.selection[0].prev
        this.selection = [prev]
        return this
    }

    // Gets all the preceding siblings of the first selected element,
    // optionally filtered by a selector.
    prevAll(selector){
        let t = this.selection[0]
        let siblings = t.parent.children
        let preceedingSibilings = _.takeWhile(siblings, c => {
            return c !== t
        })

        this.selection = preceedingSibilings
        return this
    }

    each(func){

        _.forEach(this.selection, (el, i) => {

            func.call(el, i, el)

        })

    }

}
