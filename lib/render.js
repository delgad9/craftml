var _ = require('lodash'),
    Solid = require('./solid1'),
    Group = require('./group1')

module.exports = render

function render(arg, scope) {

    var scope = scope || {}    

    if (_.isArray(arg)) {

        // arg is [element]

        var ret = arg.map(function(element) {
            return render(element, scope)
        })

        return _.compact(_.flatten(ret))

    } else {

        // arg is element
        var element = arg

        if (element.type === 'tag'){


            if (element.name === 'group'){

                var grp = new Group()
                grp.children = element.children.map(function(child) {
                    return render(child, scope)
                })
                
                return grp

            } else if (element.name === 'craft'){

                scope[element.attribs['name']] = element

                return undefined

            } else {

                // must refer to something previously defined                

                // TODO: handle not resolvable reference
                var craft = scope[element.name]
                
                return render(craft.children, scope)

            }

        } else if (element.type === 'factory') {

            return element.create()

        }

    }

    // return arg
}