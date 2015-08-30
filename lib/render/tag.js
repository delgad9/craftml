import _ from 'lodash'
import $ from '../dom'
import CSSselect from 'css-select'

import {render, renderElementList} from './render'

export default function render_tag($scope, $assert) {

    let name = this.src.name
    let craft = $scope.crafts[name]
    $assert(craft, `<${name}> is not a valid tag`)

    // take care of scope and parameters
    var childScope = $scope.clone()
    childScope.parent = $scope
    childScope.caller = this.src
    childScope.callerScope = $scope

    // enable <craft t="..." l="...">, which get prepended
    if (craft.src.attribs.t){
        this.attribs.t = craft.src.attribs.t + ' ' + this.attribs.t
    }
    if (craft.src.attribs.l){
        this.attribs.l = craft.src.attribs.l + ' ' + this.attribs.l
    }

    let params = _resolveAttributesToParameters1($scope, this.src.attribs, craft)
    // let params = this.attribs

    if (craft.static){
        childScope.parameters = params
    } else {
        var lexicallyScopedParams = _.merge(_.clone($scope.parameters), params)
        childScope.parameters = lexicallyScopedParams
    }


    //
    // Resolve 'json' parameters from children tags
    //

    let ps = _.filter(craft.params, {attribs: {'type': 'json'}})
    _.forEach(ps, p => {

        let name = p.attribs['name']
        let node = _.find(this.src.children, c => {
                return c.name == name
        })
        if (node){
            let text = _.get(node, 'children[0].data','[]')
            let o = JSON.parse(text)
            childScope.parameters[name] = o
        }
    })

    //
    // Annotate each top-level children, whether it is a parameter
    //
    _.forEach(this.src.children, function(c){
        if ($(craft.src).hasContentByName(c.name)){
            childScope.parameters[c.name] = c
        }
    })

    return craft.render(this, childScope)
}


function _resolveAttributesToParameters1($scope, attribs, craft) {
    var parameters = {}
    _.forIn(attribs, function(value, key) {

        let parameterElement = craft.params[key]

        if (parameterElement) {

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
