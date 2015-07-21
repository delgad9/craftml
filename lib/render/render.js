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

    // get rid of empty children
    // empty text tag would be converted to 'undefined'
    element.children = _.compact(element.children)

    if (!scope){
        scope = new Scope()
        scope.isRoot = true
    }
    scope.isRoot = false

    //console.log('e', element.name, element.style)

    let solid = new Solid()
    solid.role = 'group'
    solid.element = element

    solid.name = element.name
    solid.attribs = element.attribs

    scope.solid = solid

    if (scope.parent){
        scope.parent.solid.add(solid)
    }

    let cssRules = scope.css

    if (element.attribs['style'] || element.attribs['color']){
        // grab style from attribute
        let [cssText = ''] = [element.attribs['style']]

        // convert <g color="red"> to a css rule
        // --> color:red;
        let color = element.attribs['color']
        if (color){
            cssText = `color:${color};` + cssText
        }

        let ast = css.parse('* {' + cssText + '}')

        // add the new rules to the end
        cssRules = cssRules.concat(ast.stylesheet.rules)
    }

    solid.computeStyle(cssRules)

    return  Promise
        .resolve(_render_element(element, scope))
        .then(() => {

            // perform merge
            if (solid.role == 'merge'){
                _.remove(solid.parent.children, solid)
                _.forEach(solid.children, c =>{
                    solid.parent.add(c)
                })
            }

            solid.fitToChildren()
            let ret = attributes(solid, element, scope)
            return ret
        })

}


// return a list of Solid objects, one for each child of 'element'
export function renderElementList(elements, scope){

    var childScope = scope.clone()
    childScope.solids = [] // no solids, start from scratch
    childScope.parent = scope

    return Promise
        .each(elements, function(element, i) {

            return Promise
                .resolve(render(element, childScope))
                .then(function(solid){
                    if (solid){
                        // console.log('>>  got ', solid.element.name, ' as a child for ', scope.solid.element.name)
                        // scope.solid.add(solid)
                        // console.log('    now ', scope.solid.element.name, ' has ', scope.solid.children.length, 'children')
                    } else {

                        console.log('!!! error, solid is undefined for ', element.name)
                    }

                    childScope.solids = mergeChildren(scope.solid)
                })
        })
}

function mergeChildren(solid){
    let [toMerge, els] = _.partition(solid.children, (c) => {
        return c.role == 'merge'
    })
    _.remove(els, {role: 'define'})
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
        return r.func.call(scope.solid, render, element, scope)

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
