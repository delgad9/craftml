var _ = require('lodash'),
    addWith = require('with'),
    Promise = require("bluebird")

import {render, renderElementList} from './render'

export default function render_content($element, $scope) {

    this.role = 'merge'

    if ($scope.parent && $scope.caller){

        let contentScope = $scope.callerScope.clone()
        contentScope.solid = $scope.solid

        if ('name' in $element.attribs){

            // it is a 'named' content tag, look up the injected content from
            // the corresponding first-level children

            // e.g., <top></top> <---> <content name="top"></content>

            let name = $element.attribs['name']
            let m = $scope.parameters[name]
            if (m && m.type == 'tag' && m.children){
                return renderElementList(this, m.children, contentScope)
            }

        } else {

            // it is a no-name content tag, render everything inside the caller
            // tag, except for parameter tags for other named contents

            // e.g., <top></top><cube></cube>  ---> skip <top>

            // get content elements by filtering out named/parameter elements
            var contentElements = _.filter($scope.caller.children, function(c){
                return !($scope.parameters[c.name] === c)
            })

            return renderElementList(this, contentElements, contentScope)
        }

    }

    return render_default_content(this, $element.children, $scope)
}

function render_default_content($solid, elements, scope){
    return renderElementList($solid, elements, scope)
}
