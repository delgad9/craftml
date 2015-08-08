import _ from 'lodash'
import Promise from 'bluebird'
import css from 'css'

import Scope from '../scope'
import Solid from '../solid'

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
import _point from './point'

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
register('style', 'style', _style)
register('tag', 'braille', _braille)
register('tag', 'g', _group)
register('tag', 'point', _point)

// arg must be an element
export default function render(element, scope, parentSolid) {

    // console.log('render()', element.type, element.name)

    // get rid of empty children
    // empty text tag would be converted to 'undefined'
    element.children = _.compact(element.children)

    if (!scope){
        scope = new Scope()
    }

    let solid
    if (element.type != 'script'){

        solid = new Solid()
        solid.role = 'group'
        solid.element = element
        solid.id = _.get(element, 'attribs.id')
        solid.$scope = scope

        solid.name = element.name
        solid.attribs = element.attribs

        solid.parent = parentSolid
        scope.solid = solid

        solid.src = element

        if (parentSolid){
            parentSolid.add(solid)
        }

        let cssRules = scope.css

        if (element.type === 'text'){
            // these don't have attribs

        } else {


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

        }

        solid.computeStyle(cssRules)

        let func = lookupRenderer(element)
        return  Promise
            .resolve(func.call(solid, scope))
            .then(() => {

                if (solid.role == 'define' || solid.name == 'style'){
                // remove <define>
                    _.remove(solid.parent.children, solid)

                } else if (solid.role == 'merge'){
                // perform merge

                    _.remove(solid.parent.children, solid)
                    // console.log('one', element.name)
                    // solid.pp()
                    _.forEach(solid.children, c =>{
                        solid.parent.add(c)
                    })
                }

                solid.fitToChildren()
                let ret = attributes(solid, element, scope)
                return ret
            })

    } else {

        solid = parentSolid
        return Promise
            .resolve(_script.call(solid, element, scope))
            .then(() => {
                solid.fitToChildren()
                let ret = attributes(solid, element, scope)
                return ret
            })
    }
}

// return a list of Solid objects, one for each child of 'element'
export function renderElementList($solid, elements, $scope){

    var childScope = $scope.clone()
    childScope.solids = [] // no solids, start from scratch
    childScope.parent = $scope

    return Promise
        .each(elements, function(element, i) {
            return Promise.resolve(render(element, childScope, $solid))
        })
}

function mergeChildren(solid){
    let [toMerge, els] = _.partition(solid.children, (c) => {
        return c.role == 'merge'
    })
    _.remove(els, {role: 'define'})
    return _.flatten(_.map(toMerge, mergeChildren)).concat(els)
}

function lookupRenderer(element){

    let r = _.find(renderers, {type: element.type, name: element.name})
    if (r){
        return r.func

    } else if (element.type === 'tag'){

        if (_.includes(['h1','h2','h3','h4','h5'], element.name)){

            return _div

        } else {

            return _tag

        }

    } else if (element.type === 'script'){

        return _script

    } else if (element.type === 'text'){

        return _text

    } else {

        return function(){}
    }
}
