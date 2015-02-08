var _ = require('lodash')

module.exports = render

function render() {

    var arg = arguments[0]    

    if (_.isArray(arg)) {

        // arg is [element]

        arg.forEach(function(element) {        
            render(element)
        })

    } else {

        // arg is element
        var element = arg

        if (element.name === 'craft') {

            element.children.forEach(function(child) {

                render(child)

            })

        } else if (element.name === 'script'){

            element.eval()

        }

    } 

    // return arg
}