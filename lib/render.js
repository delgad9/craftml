var _ = require('lodash'),
    Promise = require("bluebird"),
    Solid = require('./solid'),
    // Group = require('./group'),
    Scope = require('./scope'),
    fs = require('fs')

module.exports = render

var _parameter = require('./render/parameter')
var _content = require('./render/content')
var _craft = require('./render/craft')
var _part = require('./render/part')
var _tag = require('./render/tag')
var _stl = require('./render/stl')
var _script = require('./render/script')

function render(arg, scope) {

    //var scope = scope || new Scope()
    if (!scope){
        scope = new Scope()
        scope.isRoot = true
    }

    if (_.isArray(arg)) {

        // arg is [element]

        var childrenScope = scope.clone()
        childrenScope.solids = []

        return Promise
            .each(arg, function(element, i) {

                //console.log(childrenScope.isRoot)

                return render(element, childrenScope)
                    .then(function(solids) {

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

    } else if (arg){

        // arg is element
        var element = arg
        if (element.type === 'tag') {

            if (element.name === 'craft') {

                return _craft(render, element, scope)

            } else if (element.name === 'part'){

                return _part(render, element, scope)

            } else if (element.name === 'parameter') {

                return _parameter(render, element, scope)

            } else if (element.name === 'content') {

                return _content(render, element, scope)

            } else if (element.name === 'stl') {

                return _stl(render, element, scope)


            } else {

                return _tag(render, element, scope)

            }

        } else if (element.type === 'script') {
            if (element.emit)
                element.emit('render', element, scope)
            return _script(render, element, scope)

        } else {
            return []
        }

    } else {
        return []
    }
}
