var _ = require('lodash'),
    addWith = require('with')

module.exports = function(render, element, scope) {
    // must refer to something previously defined

    var craft = scope.crafts[element.name]
    if (craft === undefined)
        throw 'can not resolve <' + element.name + '>'

    // pass attribs as parameters
    var childScope = scope.clone()
    childScope.isRoot = true
    childScope.parent = scope
    childScope.solids = [] // no solids, start from scratch

    var params = resolveAttributesToParameters(scope, element.attribs, craft)
    var lexicalScopedParams = _.merge(scope.parameters, params)
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

            // apply color
            if (element.attribs['color']){
                solids.forEach(function(solid) {
                    solid.color = element.attribs['color']
                })
            }

            // apply align
            if (element.attribs['align']){
                var code = element.attribs['align']
                var resolved = resolveAttribueValue(scope, code)
                solids.forEach(function(solid) {
                    solid.alignEval(resolved)
                })
            }

            // apply layout (deprecated)
            if (element.attribs['layout']){
                var code = element.attribs['layout']
                var resolved = resolveAttribueValue(scope, code)
                solids.forEach(function(solid) {
                    solid.layoutEval(resolved)
                })
            }

            // apply transform
            if (element.attribs['transform']){
                var code = element.attribs['transform']
                // var resolved = evalAttributeValue(scope, code)
                solids.forEach(function(solid) {
                    solid.transformEval(code, scope.parameters)
                })
            }

            // apply cut
            if ('cut' in element.attribs){

                solids.forEach(function(solid) {
                    solid.cut = true
                })

            } else {

                solids.forEach(function(solid) {
                    var children = solid.children

                    // apply cut (if any of the children needs to be cut)
                    var isCutNeeded = _.some(children, function(c){
                        return c.cut
                    })

                    if (isCutNeeded){
                        solid.apply()
                    }

                })

            }


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

// function evalAttributeValue(scope, value){
//     var o = {}
//     var withExpr = addWith('scope.parameters', 'o.v = ' + value)
//     eval(withExpr)
//     return o.v
// }

function resolveAttribueValue(scope, value) {
    if (_.isString(value)) {

        // resolve {{ }}

        // if the expression has any {{ }}
        var res = value.match(/{{(.*)}}/)
        if (res) {


            if (value.match(/^{{([^{^}]*)}}$/)){
                // <foo x="{{obj}}"/>

                // console.log('eval as an object')

                var o = {}
                var expr = res[1]
                var withExpr = addWith('scope.parameters', 'o.v = ' + expr)
                eval(withExpr)
                // console.log(o.v)
                return o.v

            } else {
                // <foo x="bar({{obj}})"/>

                // console.log('eval as a template')
                _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
                var compiled = _.template(value)
                var ret = compiled(scope.parameters)
                return ret
            }

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
