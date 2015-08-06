import _ from 'lodash'
// require $ from '../dom'
import $ from '../dom'
import CSSselect from 'css-select'

import {render, renderElementList} from './render'

export default function render_tag($element, $scope) {

    // console.log(`rendering <${element.name}> with params=${JSON.stringify(scope.parameters)}`)

    var craft = $scope.crafts[$element.name]
    var part = $scope.parts[$element.name]

    if (!craft && !part){
        throw 'can not resolve <' + $element.name + '>'
    }

    var toRender = craft || part

    // take care of scope and parameters

    var childScope = $scope.clone()
    childScope.solids = [] // no $solids, start from scratch
    childScope.parent = $scope
    childScope.caller = $element


    var params = _resolveAttributesToParameters($scope, $element.attribs, toRender)
    if (craft){
        childScope.parameters = params
    } else if (part){
        var lexicallyScopedParams = _.merge(_.clone($scope.parameters), params)
        childScope.parameters = lexicallyScopedParams
    }

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
    _.forEach($element.children, function(c){
        if ($(toRender).hasContentByName(c.name)){
            childScope.parameters[c.name] = c
        }
    })

    // attach the craft to the caller as a descendent (as least temporarily until
    // this craft is invoked by another tag) (this probably won't work for
    // recursive fractal cases)
    toRender.parent = $element

    childScope.element = $element
    childScope.solid = this
    childScope.callerScope = $scope

    // TODO: move this somewhere else?
    if (toRender.attribs['grouping'] == 'off'){
        this.role = 'merge'
    }

    return renderElementList(this, toRender.children, childScope)
}

function _resolveAttributesToParameters($scope, attribs, craft) {
    var parameters = {}
    _.forIn(attribs, function(value, key) {
        var attrName = key

        // console.log($(craft).getParameterByNameOrAlias(attrName))

        let parameterElement = $(craft).getParameterByNameOrAlias(attrName)
        // check if callee has the parameter by the attrib name
        if (craft === undefined || parameterElement) {

            let resolved=  $scope.resolve(value)

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
