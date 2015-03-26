var _ = require('lodash')

module.exports = function(render, element, scope) {
    // must refer to something previously defined
    
    var craft = scope.crafts[element.name]
    // console.log(scope)
    if (craft === undefined)
        throw 'can not resolve <' + element.name + '>'

    // pass attribs as parameters
    var childScope = scope.clone()
    childScope.isRoot = true
    childScope.parent = scope
    childScope.solids = [] // no solids, start from scratch

    var params = resolveAttributesToParameters(scope, element.attribs, craft)
    var lexicalScopedParams = _.merge(scope.parameters, params)
    // console.log(scope.parameters)
    childScope.parameters = params
    childScope.caller = element

    return render(craft, childScope)
        .then(function(solids) {

            var loc = {}
            // apply x, y, z offsets (if any),
            // but not for those using x, y, z as parameters (e.g., scale, crop)            
            var dims = ['x', 'y', 'z']
            dims.forEach(function(dim) {
                if (element.attribs[dim] && !doesCraftHaveParameterByName(craft, dim)) {
                    var resolved = resolveAttribueValue(scope, element.attribs[dim])
                    loc[dim] = Number(resolved)
                }
            })

            solids.forEach(function(solid) {                
                var oldloc = _.clone(solid.layout.location)
                var newloc = _.merge(oldloc, loc)
                solid.translateTo(newloc)
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

function doesCraftHaveParameterByName(craft, attrName){
    return hasParameterByName(craft.children, attrName)
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