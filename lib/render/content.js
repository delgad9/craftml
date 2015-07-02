var _ = require('lodash'),
    addWith = require('with'),
    Promise = require("bluebird")

var _D = function(){}//console.log

module.exports = function(render, element, scope) {


    if ('name' in element.attribs){
        // it is a 'named' content tag, look up the injected content from
        // the corresponding first-level children
        _D('we are dealing with a named content')

        if (scope.parent && scope.caller){

            _D('the caller tag is', scope.caller)
            _D('the children of the caller tag is', scope.caller.children)

            // look for a matching named child
            // e.g., <top></top> <---> <content name="top"></content>
            var m = _.find(scope.caller.children, function(c){
                return c.name == element.attribs['name']
            })

            _D('the matched child is', m)
            if (m){
                return render(m.children, scope.parent)
            } else {
                return _render_default_content(render, element.children, scope)
            }
        } else {

            // console.log('the children are', element.children)
            return _render_default_content(render, element.children, scope)
        }

    } else {
        // it is the default content tag (no name), we render all the
        // content inside the caller tag.

        // check if it's being called (i.e., having a caller)
        if (scope.parent && scope.caller) {

            // filter out named content parameter tags
            var notParameters = _.filter(scope.caller.children, function(c){
                return !c.flags.isContentParameter
            })

            return render(notParameters, scope.parent)

        } else {
            // if not, render the children within <content></content>
            // which acts as the "default" content
            return _render_default_content(render, element.children,scope)
        }

    }
}

function _render_default_content(render, elements, scope){
    return render(elements, scope)
        .then(function(solids){

            // assign a special class label
            // viewer can display it differently
            _.forEach(solids, function(solid){
                solid.class = '_content'
            })

            return solids
        })
}
