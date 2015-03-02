var _ = require('lodash')

module.exports = function(render, element, scope) {
    // must refer to something previously defined

    // TODO: handle not resolvable reference
    var craft = scope[element.name]
    if (craft === undefined)
        throw 'can not resolve <' + element.name + '>'

    // pass attribs as parameters
    var childScope = scope.clone()
    childScope.isRoot = true
    childScope.parent = scope
    childScope.solids = [] // no solids, start from scratch
    childScope.parameters = resolveAttributesToParameters(scope, element.attribs, craft)
    childScope.caller = element

    return render(craft, childScope)
        .then(function(solids) {

            // apply x, y, z offsets (if any)
            var dims = ['x', 'y', 'z']
            dims.forEach(function(dim) {

                if (element.attribs[dim]) {
                    solids.forEach(function(solid) {
                        var resolved = resolveAttribueValue(scope, element.attribs[dim])
                        solid.layout.location[dim] = Number(resolved)
                    })
                }

            })

            return solids
        })

}

function hasParameterByName(elements, name) {
    return _.some(elements, function(element) {

        var pattern = {
            type: 'tag',
            name: 'parameter',
            attribs: {
                name: name
            }
        }

        return _.isMatch(element, pattern)
    })
}


function resolveAttribueValue(scope, value) {
    if (_.isString(value)) {

        // resolve {{ }}

        var res = value.match(/{{(.*)}}/)
        if (res) {
            var expr = res[1]
            return scope.parameters[expr]

        } else {

            return value
        }

    } else {

        return value
    }
}

function resolveAttributesToParameters(scope, attribs, craft) {

    var parameters = {}

    _.forIn(attribs, function(value, key) {

        var attrName = key

        // check if callee has the parameter by the attrib name
        if (craft === undefined || hasParameterByName(craft.children, attrName)) {

            var resolved = resolveAttribueValue(scope, value)

            parameters[attrName] = resolved
        }

    })

    return parameters

}