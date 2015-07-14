import _ from 'lodash'
import Promise from 'bluebird'
import Scope from '../scope'
import _tag from './tag'
import _script from './script'
import _craft from './craft'
import _stl from './stl'
import _repeat from './repeat'
import _part from './part'
import _content from './content'
import _parameter from './parameter'
import _path from './path'
import _solidify from './solidify'
import _text from './text'
import _div from './div'
import _style from './style'
import _braille from './braille'
import _group from './group'

import Solid from '../solid'

let renderers = []

function register(type, name, func){
    renderers.push({type, name, func})
}

function find(type, name) {
    return _.find(renderers, {type, name})
}

register('tag', 'craft', _craft)
register('tag', 'stl', _stl)
register('tag', 'repeat', _repeat)
register('tag', 'part', _part)
register('tag', 'content', _content)
register('tag', 'parameter', _parameter)
register('tag', 'info', _.partial(Promise.resolve, []))
register('tag', 'path', _path)
register('tag', 'solidify', _solidify)
register('tag', 'div', _div)
register('tag', 'style', _style)
// register('tag', 'braille-dot', _braille_dot)
register('tag', 'braille', _braille)
register('tag', 'g', _group)
// register('tag', 'braille', _braille)

//
// [...] => [...]
// solid => [solid]
// null, undefined => []
//
function normalizeResult(s){
     return _.compact(_.flatten([s]))
}

// arg must be an element
export default function render(element, scope) {

    console.log('render()', element.type, element.name)
    if (!element.type){
        console.log(element)
    }

    if (!scope){
        scope = new Scope()
        scope.isRoot = true
    }

    scope.isRoot = false    

    //
    // if (_.isArray(arg)) {
    //
    //     // arg is [element]
    //     return _render_element_array(arg, scope)
    //
    //
    // } else if (arg){

        // arg is element
        // let element = arg

    // if (element.attribs){
    //     // grab style from attribute
    //     let [cssText = ''] = [element.attribs['style']]
    //     let ast = css.parse('* {' + cssText + '}')
    //     scope.css = scope.css.concat(ast.stylesheet.rules)
    // }
    //
    // element.style = scope.computeStyle(element)
        // console.log('e', element.name, element.style)

    let solid = new Solid()
    solid.type = 'merge'
    solid.element = element.name
    scope.solid = solid

    return  Promise
        .resolve(_render_element(element, scope))
        .then(ret => {
            if (ret){
            //
            //     console.log('ret => ', ret)//element.name, ret.type, ret)
            //     // ret.element = element.name
                // solid.children.push(ret)// = [ret]
                // solid.pp()
                return solid

            } else {

                return solid

            }
            // else
            //     consle.log()
            // return ret
        })


        //

        //
        //     if (0){
        //
        //         // add style information to each rendered solid
        //         // using default so that it won't be overwritten by parents'
        //         // style properties (in sitautions when multiple nested tags are
        //         // applied to the same group of solids, such as stack)
        //         _.forEach(solids, s => {
        //
        //             // console.log('s=>', element.name, s.style['box-color'], element.style['box-color'])
        //             s.style = _.defaults(s.style, element.style)
        //         })
        //
        //     }
        //
        //     // if (!solids){
        //     //
        //     //     let empty = {}//new Solid()
        //     //     empty.type = 'empty'
        //     //     empty.element = element.name
        //     //     return empty
        //     //
        //     // } else if (solids.length === 1){
        //     //     solids[0].element = 'one'//element.name
        //     //     return solids[0]
        //     //
        //     // } else {
        //     //
        //     //     let merged = {}//new Solid()
        //     //     merged.type = 'merged'
        //     //     merged.element = element.name
        //     //     merged.children = solids
        //     //     return merged
        //     //
        //     // }
        //     // return solids
        // })
    // }
}

// return a list of Solid objects, one for each child of 'element'
export function renderElementList(elements, scope){


    var childScope = scope.clone()
    childScope.solids = [] // no solids, start from scratch
    // childScope.info = {}
    childScope.isRoot = true
    childScope.parent = scope
    // childScope.caller = element

    // children
    return Promise
        .each(elements, function(element, i) {

            return Promise
                .resolve(render(element, childScope))
                .then(function(solid){

                    console.log('>>  got ', solid.element, ' as a child for ', scope.solid.element)
                    // scope.solid =
                    // if (scope.solid)
                    scope.solid.children.push(solid)
                    console.log('    now ', scope.solid.element, ' has ', scope.solid.children.length, 'children')

                    // console.log('element', element.name, 'solids:', _.compact(solids))
                    // if (solids.length == 1){
                    //     // childrenScope.solid.element = element.name
                    //     childrenScope.solid.children.push(solids[0])
                    // } else if (solids){
                    //     // childrenScope.solid.element = element.name
                    //     childrenScope.solid.children.push(solids)//:'empty'})
                    // } else {
                    //     // childrenScope.solid.element = element.name
                    //     childrenScope.solid.children.push({type:'empty', element: element.name})
                    // }
                    // childrenScope.solid.children.push(_.compact(solids)[0])

                    // if (_.isArray(solids)) {
                    //     childrenScope.solids = childrenScope.solids.concat(solids)
                    // } else if (solids) {
                    //     childrenScope.solids.push(solids)
                    // }
                })
        })
        // .then(function() {
        //     // return childrenScope.solids
        //     // return scope.solid.children
        // })
        // .then(_.flatten)
        // .then(_.compact)
}

import css from 'css'


//
// [Solid]
// falsy values
// Solid
// Promise that returns above

function _render_element(element, scope){

    let r = find('tag', element.name)
    if (r){
        return r.func(render, element, scope)

    } else if (element.type === 'tag'){

        if (_.includes(['h1','h2','h3','h4','h5'], element.name)){

            return _div(render, element, scope)

        } else {
            if (element.name == 'char'){
                console.time(element.name)
            }
            return _tag(render, element, scope)
                .then(solids =>{
                    if (element.name == 'char'){
                        console.timeEnd(element.name)
                    }
                    return solids
                })
        }

    } else if (element.type === 'script'){
        // console.log('rendering script')
        return _script(render, element, scope)

    } else if (element.type === 'text'){
        console.log('rendering text')
        return _text(render, element, scope)

    } else {

        return []
    }
}
