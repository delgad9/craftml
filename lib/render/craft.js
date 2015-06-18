var Promise = require("bluebird")

module.exports = function(render, element, scope) {

    if (scope.isRoot) {

        var childScope = scope.clone()
        return render(element.children, childScope)

    } else {

        // compute all <content> parameters of this craft
        element.contents = element.getContentParameters()

        scope.crafts[element.attribs['name']] = element
        
        return Promise.resolve(null)

    }

}
