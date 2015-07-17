var _ = require('lodash'),
    addWith = require('with'),
    Promise = require("bluebird")

import {render, renderElementList} from './render'

export default function render_content(render, element, scope) {

    scope.solid.role = 'merge'

    if (scope.parent && scope.caller){

        if ('name' in element.attribs){

            // it is a 'named' content tag, look up the injected content from
            // the corresponding first-level children

            // look for a matching named child
            // e.g., <top></top> <---> <content name="top"></content>
            var m = _.find(scope.caller.children, function(c){
                return c.name == element.attribs['name']
            })
            if (m){

                // console.log('the matched child is', m.name, m.attribs)
                let contentScope = scope.callerScope.clone()
                contentScope.solid = scope.solid

                // m.style = scope.computeStyle(m)
                return renderElementList(m.children, contentScope)
            }

        } else {

            // filter out named content parameter tags
            var notParameters = _.filter(scope.caller.children, function(c){
                return !(c.flags && c.flags.isContentParameter)
            })

            let contentScope = scope.callerScope.clone()
            contentScope.solid = scope.solid

            return renderElementList(notParameters, contentScope)
        }

    }

    return render_default_content(element.children, scope)
}

function render_default_content(elements, scope){

    console.log('rendering default content')

    return renderElementList(elements, scope)
        .then(function(solids){

            // assign a special class label
            // viewer can display it differently
            // _.forEach(solids, function(solid){
            //     solid.class = '_content'
            // })

            // return solids
        })
}
