var Promise = require("bluebird"),
    _ = require('lodash')

module.exports = function(render, element, scope) {

    var info = scope.info
    _.forEach(element.children, function(c){

        var key = c.name
        var value = (c.children[0] || {'attribs':{}}).attribs['text']
        if (value)
            info[key] = value

    })

    return Promise.resolve(null)
}
