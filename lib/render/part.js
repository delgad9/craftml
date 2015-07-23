var Promise = require("bluebird")

export default function(element, scope) {
    scope.parts[element.attribs['name']] = element            
}
