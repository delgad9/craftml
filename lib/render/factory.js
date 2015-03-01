var Promise = require("bluebird")

module.exports = function(render, element, scope) {
    var parameters = scope.parameters

    return new Promise(function(resolve, reject) {
        // console.log('*factory')
        var solid = element.create(parameters)
            // console.log('*factory:create')
        if (solid) {
            resolve(solid)
        } else {
            reject()
        }
    })
}