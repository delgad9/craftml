var _ = require('lodash')

module.exports = function(render, element, scope) {
    // must refer to something previously defined

    var craft = scope.crafts[element.name]
    var part = scope.parts[element.name]

    if (!craft && !part){
        throw 'can not resolve <' + element.name + '>'
    }

    var toRender = craft || part

    // take care of scope and parameters

    var childScope = scope.clone()
    childScope.solids = [] // no solids, start from scratch
    childScope.isRoot = true
    childScope.parent = scope
    childScope.caller = element

    var params = _resolveAttributesToParameters(scope, element.attribs, toRender)
    if (craft){
        childScope.parameters = params
    } else if (part){
        var lexicallyScopedParams = _.merge(_.clone(scope.parameters), params)
        childScope.parameters = lexicallyScopedParams
    }


    //
    // Resolve 'json' parameters from children tags
    //
    var ps = toRender.getParametersByType('json')
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


    childScope.element = element
    childScope.renderable = toRender

    return render(toRender, childScope)
        .then(function(solids) {
            return _process_attributes(solids, element, childScope)
        })

}

var processors = []
//
// type: each, all, map
//
function _add_attribute_processor(name, func, type){
    var proc = {
        name: name,
        func: func,
        type: type
    }
    processors.push(proc)
}

_add_attribute_processor(['x','y','z'], require('./attribs/offset'), 'all')
_add_attribute_processor(['color'], require('./attribs/color'), 'each')
_add_attribute_processor(['class'], require('./attribs/class'), 'each')
_add_attribute_processor(['id'], require('./attribs/id'), 'each')
_add_attribute_processor(['align'], require('./attribs/align'), 'each')
_add_attribute_processor(['transform'], require('./attribs/transform'), 'each')
_add_attribute_processor(['cut'], require('./attribs/cut'), 'map')

function _process_attributes(solids, element, scope){

    _.forEach(processors, function(proc){

        if (_.some(proc.name, function(o) { return o in element.attribs})) {

            if (proc.type === 'all') {

                proc.func(solids, element, scope)

            } else if (proc.type === 'each'){

                _.forEach(solids, function(solid){
                    proc.func(solid, element, scope)
                })

            } else if (proc.type === 'map'){

                solids = proc.func(solids, element, scope)

            }

        }

    })

    return solids
}

function _resolveAttributesToParameters(scope, attribs, craft) {
    var parameters = {}
    _.forIn(attribs, function(value, key) {
        var attrName = key
        // check if callee has the parameter by the attrib name
        if (craft === undefined || craft.hasParameterByName(attrName)) {
            var resolved = scope.resolve(value)
            parameters[attrName] = resolved
        }
    })
    return parameters
}
