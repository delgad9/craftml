var _ = require('lodash'),
    Promise = require("bluebird"),
    Solid = require('./solid'),
    Group = require('./group'),
    Scope = require('./scope'),
    fs = require('fs')

module.exports = render

var _parameter = require('./render/parameter')
var _content = require('./render/content')
var _stl = require('./render/stl')
var _group = require('./render/group')
var _craft = require('./render/craft')
var _others = require('./render/others')

var _script = require('./render/script')
var _factory = require('./render/factory')

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

    } else {

        // arg is element
        var element = arg

        // scope.trace = scope.trace || []
        // scope.trace.push(element.type + ":" + element.name)


        if (element.type === 'tag') {

            if (element.name === 'craft') {

                return _craft(render, element, scope)

            } else if (element.name === 'group') {

                return _group(render, element, scope)

            } else if (element.name === 'stl') {

                return _stl(render, element, scope)

            } else if (element.name === 'parameter') {

                return _parameter(render, element, scope)

            } else if (element.name === 'content') {

                return _content(render, element, scope)

            } else {

                return _others(render, element, scope)

            }

        } else if (element.type === 'script') {

            return _script(render, element, scope)

        } else if (element.type === 'factory') {

            return _factory(render, element, scope)


        }

    }
}