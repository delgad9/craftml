var Promise = require("bluebird")

module.exports = function(render, element, scope) {

    var name = element.attribs['name']

    var val
    if (!(name in scope.parameters)) {
        // not set by the caller
        // use the default value

        val = element.attribs['default']

    } else {

        val = scope.parameters[name]
    }

    var type = element.attribs['type']
    if (type === 'int' || type === 'float') {
        val = Number(val)
    } else if (type === 'string') {

        val = '' + val
    }

    if (val === undefined) {
        val = ''
    }

    scope.parameters[name] = val

    // does not render to anything
    return new Promise(function(resolve, reject) {
        resolve(null)
    })

}