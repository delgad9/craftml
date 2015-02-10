var _ = require('lodash'),
    Solid = require('./solid1'),
    Group = require('./group1'),
    Scope = require('./scope')

module.exports = render

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
        // })
        // element.type == 'tag' && element.name == 'parameter' && element.attribs['name'] == name
        // })
}


function resolveAttributesToParameters(scope, attribs, craft) {

    var parameters = {}

    _.forIn(attribs, function(value, key) {

        var attrName = key

        // check if callee has the parameter by the attrib name
        if (craft === undefined || hasParameterByName(craft.children, attrName)) {

            var resolved
            if (_.isString(value)) {

                // resolve {{ }}

                var res = value.match(/{{(.*)}}/)
                if (res) {
                    var expr = res[1]
                    resolved = scope.parameters[expr]
                }
            } else {

                resolved = value
            }

            parameters[attrName] = resolved

        }

    })

    return parameters

}

function render(arg, scope) {

    var scope = scope || new Scope()

    if (_.isArray(arg)) {

        // arg is [element]

        var ret = arg.map(function(element) {
            return render(element, scope)
        })

        return _.compact(_.flatten(ret))

    } else {

        // arg is element
        var element = arg

        if (element.type === 'tag') {


            if (element.name === 'group') {

                var grp = new Group()
                grp.children = element.children.map(function(child) {
                    return render(child, scope)
                })

                return grp

            } else if (element.name === 'craft') {

                scope[element.attribs['name']] = element

                return undefined

            } else if (element.name === 'parameter') {

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
                if (type === 'int') {
                    val = Number(val)
                } else if (type === 'string') {

                    val = '' + val
                }

                if (val === undefined) {
                    val = ''
                }

                scope.parameters[name] = val

                return undefined // does not render to anything

            } else if (element.name === 'content') {

                console.log(scope.callee)
                scope.callee

                return render(scope.callee.children)


            } else {

                // must refer to something previously defined                

                // TODO: handle not resolvable reference
                var craft = scope[element.name]
                if (craft === undefined)
                    throw 'can not resolve <' + element.name + '>'

                // pass attribs as parameters
                var childScope = scope.clone()

                childScope.parameters = resolveAttributesToParameters(scope, element.attribs, craft)

                childScope.callee = element
                return render(craft.children, childScope)

            }

        } else if (element.type === 'factory') {

            var parameters = scope.parameters

            return element.create(parameters)

        }

    }

    // return arg
}