var select = require('../select'),
    _ = require('lodash')

module.exports = function(solid, element, scope) {
    // parent accesses the <group align='xxxx'>
    var code = scope.parent.resolve(element.attribs['align'])
    var selector = scope.parent.resolve(element.attribs['at'])
    solid.align(code, selector)
}
