var select = require('../select'),
    _ = require('lodash')

module.exports = function(solid, element, scope) {
    // parent accesses the <group align='xxxx'>
    var code = scope.parent.resolve(element.attribs['layout'])
    // var selector = scope.parent.resolve(element.attribs['at'])
    solid.layoutEval(code, scope.parent.parameters)
}
