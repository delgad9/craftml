var Promise = require("bluebird")

module.exports = function(render, element, scope) {

    return new Promise(function(resolve, reject) {
        scope[element.attribs['name']] = element
        resolve(null)
    })

}