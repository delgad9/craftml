import _ from 'lodash'

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

_add_attribute_processor(['x','y','z'], require('./offset'), 'all')
_add_attribute_processor(['color'], require('./color'), 'each')
_add_attribute_processor(['class'], require('./class'), 'each')
_add_attribute_processor(['id'], require('./id'), 'each')
_add_attribute_processor(['layout','l'], require('./layout'), 'each')
_add_attribute_processor(['transform','t'], require('./transform'), 'each')
_add_attribute_processor(['cut'], require('./cut'), 'map')

export default function process_attributes(solid, element, scope){

    if (!element.attribs){
        // no attribute to process
        return//console.log('element', element)
    }
    _.forEach(processors, function(proc){

        if (_.some(proc.name, function(o) { return o in element.attribs})) {

            if (proc.type === 'all') {

                // proc.func(solids, element, scope)

            } else if (proc.type === 'each'){

                // _.forEach(solids, function(solid){
                    proc.func(solid, element, scope)
                // })

            } else if (proc.type === 'map'){

                    proc.func(solid, element, scope)

            }

        }

    })

    return solid
}



function _resolveAttributesToParameters(scope, attribs, craft) {
    var parameters = {}
    _.forIn(attribs, function(value, key) {
        var attrName = key

        // console.log($(craft).getParameterByNameOrAlias(attrName))

        let parameterElement = $(craft).getParameterByNameOrAlias(attrName)
        // check if callee has the parameter by the attrib name
        if (craft === undefined || parameterElement) {

            let resolved=  scope.resolve(value)

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
