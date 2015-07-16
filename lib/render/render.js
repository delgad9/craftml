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

import attributes from './attribs'

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

    // console.log('render()', element.type, element.name)

    if (!scope){
        scope = new Scope()
        scope.isRoot = true
    }
    scope.isRoot = false

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
    solid.role = 'group'
    solid.merge = true
    solid.element = element//.name
    scope.solid = solid

    return  Promise
        .resolve(_render_element(element, scope))
        .then(() => {
            return attributes(solid, element, scope)
        })


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
}

// return a list of Solid objects, one for each child of 'element'
export function renderElementList(elements, scope){

    var childScope = scope.clone()
    childScope.solids = [] // no solids, start from scratch
    childScope.isRoot = true
    childScope.parent = scope

    return Promise
        .each(elements, function(element, i) {

            return Promise
                .resolve(render(element, childScope))
                .then(function(solid){
                    if (solid){
                        // console.log('>>  got ', solid.element.name, ' as a child for ', scope.solid.element.name)
                        scope.solid.children.push(solid)
                        // console.log('    now ', scope.solid.element.name, ' has ', scope.solid.children.length, 'children')
                    } else {

                        console.log('!!! error, solid is undefined for ', element.name)
                    }

                    childScope.solids = mergeChildren(scope.solid)

                    scope.solid.fitToChildren()
                })
        })
}

function mergeChildren(solid){
    let [toMerge, els] = _.partition(solid.children, (c) => {
        return c.type == 'merge'
    })
    _.remove(els, {type: 'define'})
    return _.flatten(_.map(toMerge, mergeChildren)).concat(els)
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
