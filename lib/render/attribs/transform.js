module.exports = function(solid, element, scope) {
    // var code = element.attribs['transform']
    var code = scope.parent.resolve(element.attribs['transform'])
    solid.transformEval(code, scope.parent.parameters)
}
