import _ from 'lodash'
// require $ from '../dom'
import $ from '../dom'
import CSSselect from 'css-select'

import {render, renderElementList} from './render'

export default function render_tag(render, element, scope) {
    // must refer to something previously defined

    // console.log(`rendering <${element.name}> with params=${JSON.stringify(scope.parameters)}`)

    var craft = scope.crafts[element.name]
    var part = scope.parts[element.name]

    if (!craft && !part){
        throw 'can not resolve <' + element.name + '>'
    }

    var toRender = craft || part

    // take care of scope and parameters

    var childScope = scope.clone()
    childScope.solids = [] // no solids, start from scratch
    childScope.info = {}
    childScope.isRoot = true
    childScope.parent = scope
    childScope.caller = element


    var params = _resolveAttributesToParameters(scope, element.attribs, toRender)
    if (craft){
        childScope.parameters = params
    } else if (part){
        var lexicallyScopedParams = _.merge(_.clone(scope.parameters), params)
        childScope.parameters = lexicallyScopedParams
    }


    // console.log('===>', params)

    //
    // Resolve 'json' parameters from children tags
    //
    let ps = $(toRender).getParametersByType('json')
    _.forEach(ps, function(p){

        var name = p.attribs['name']
        var node = _.find(element.children, function(c){
                return c.name == name
            })
        if (node){
            // assume only one child node and it's text
            var text = node.children[0].attribs['text']
            var o = JSON.parse(text)
            childScope.parameters[name] = o
        }
    })

    //
    // Annotate each top-level children, whether it is a parameter
    //
    _.forEach(element.children, function(c){
        if ($(toRender).hasContentByName(c.name)){
            c.flags = {isContentParameter: true}
        }
    })

    //
    // Compute Style
    //

    // attach the craft to the caller as a descendent (as least temporarily until
    // this craft is invoked by another tag) (this probably won't work for
    // recursive fractal cases)
    toRender.parent = element

    // element.children.push(toRender)
    // this might mess up <content></content>, is this necessary for css-selector
    // to work? --> doesn't seem so

    let computedStyle = scope.computeStyle(element)

    childScope.element = element
    childScope.renderable = toRender
    childScope.solid = scope.solid
    childScope.callerScope = scope

    // console.log(toRender)

    return renderElementList(toRender.children, childScope)
    // return renderElementList(toRender.children, scope)

    // return render(toRender, childScope)
    //     .then(function(solids) {
    //             // console.log(solids)
    //             return solids
    //     })
}


        //     // TODO: think about whehter passing in scope makes more sense
        //     // attach style?
        //
        //     // Apply Style
        //     _.forEach(solids, s => {
        //         s.name = element.name
        //     })
        //
        //     return _process_attributes(solids, element, childScope)
        // })


var processors = []
//
// type: each, all, map
//
function _add_attribute_processor(name, func, type){
    var proc = {
        name: name,
        func: func,
        type: type
    }
    processors.push(proc)
}

_add_attribute_processor(['x','y','z'], require('./attribs/offset'), 'all')
_add_attribute_processor(['color'], require('./attribs/color'), 'each')
_add_attribute_processor(['style'], require('./attribs/style'), 'each')
_add_attribute_processor(['class'], require('./attribs/class'), 'each')
_add_attribute_processor(['id'], require('./attribs/id'), 'each')
_add_attribute_processor(['align'], require('./attribs/align'), 'each')
_add_attribute_processor(['layout','l'], require('./attribs/layout'), 'each')
_add_attribute_processor(['transform','t'], require('./attribs/transform'), 'each')
_add_attribute_processor(['cut'], require('./attribs/cut'), 'map')

function _process_attributes(solids, element, scope){

    _.forEach(processors, function(proc){

        if (_.some(proc.name, function(o) { return o in element.attribs})) {

            if (proc.type === 'all') {

                proc.func(solids, element, scope)

            } else if (proc.type === 'each'){

                _.forEach(solids, function(solid){
                    proc.func(solid, element, scope)
                })

            } else if (proc.type === 'map'){

                solids = proc.func(solids, element, scope)

            }

        }

    })

    return solids
}



function _resolveAttributesToParameters(scope, attribs, craft) {
    var parameters = {}
    _.forIn(attribs, function(value, key) {
        var attrName = key

        // console.log($(craft).getParameterByNameOrAlias(attrName))

        let parameterElement = $(craft).getParameterByNameOrAlias(attrName)
        // check if callee has the parameter by the attrib name
        if (craft === undefined || parameterElement) {

            let resolved=  scope.resolve(value)

            let name =  parameterElement.attribs['name']
            parameters[name] = resolved

            // set alias, if specified
            let alias = parameterElement.attribs['alias']
            if (alias){
                parameters[alias] = resolved
            }

        }
    })
    return parameters
}
