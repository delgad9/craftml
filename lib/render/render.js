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
// register('tag', 'braille', _braille)

//
// [...] => [...]
// solid => [solid]
// null, undefined => []
//
function normalizeResult(s){
     return _.compact(_.flatten([s]))
}

export default function render(arg, scope) {

    if (!scope){
        scope = new Scope()
        scope.isRoot = true
    }

    if (_.isArray(arg)) {

        // arg is [element]
        return _render_element_array(arg, scope)


    } else if (arg){

        // arg is element
        let element = arg

        if (element.attribs){
            // grab style from attribute
            let [cssText = ''] = [element.attribs['style']]
            let ast = css.parse('* {' + cssText + '}')
            scope.css = scope.css.concat(ast.stylesheet.rules)
        }

        element.style = scope.computeStyle(element)

        return  Promise
            .resolve(_render_element(element, scope))
            .then(normalizeResult)
            .then(solids => {

                // add style information to each rendered solid
                // using default so that it won't be overwritten by parents'
                // style properties (in sitautions when multiple nested tags are
                // applied to the same group of solids, such as stack)
                _.forEach(solids, s => {
                    s.style = _.defaults(s.style, element.style)
                })

                return solids
            })
    }
}

function _render_element_array(elements, scope){

    var childrenScope = scope.clone()
    childrenScope.solids = []

    return Promise
        .each(elements, function(element, i) {

            return Promise
                .resolve(render(element, childrenScope))
                .then(function(solids){

                    if (_.isArray(solids)) {
                        childrenScope.solids = childrenScope.solids.concat(solids)
                    } else if (solids) {
                        childrenScope.solids.push(solids)
                    }

                })
        })
        .then(function() {
            return childrenScope.solids
        })
        .then(_.flatten)
        .then(_.compact)
}

import css from 'css'

function _render_element(element, scope){

    let r = find('tag', element.name)
    if (r){
        return r.func(render, element, scope)

    } else if (element.type === 'tag'){

        if (_.includes(['h1','h2','h3','h4','h5'], element.name)){

            return _div(render, element, scope)

        } else {

            return _tag(render, element, scope)

        }

    } else if (element.type === 'script'){

        return _script(render, element, scope)

    } else if (element.type === 'text'){

        return _text(render, element, scope)

    } else {

        return []
    }
}
