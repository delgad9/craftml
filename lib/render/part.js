var Promise = require("bluebird")

module.exports = function(render, element, scope) {
    if (scope.isRoot) {

        var childScope = scope.clone()
        return render(element.children, childScope)

    } else {
        return new Promise(function(resolve, reject) {
            scope.parts[element.attribs['name']] = element
            resolve(null)
        })
    }

}
