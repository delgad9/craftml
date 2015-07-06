module.exports = function(solid, element, scope) {
    // var code =
    let code = element.attribs['transform'] ||  element.attribs['t'] || ''
    code = scope.parent.resolve(code)
    solid.transformEval(code, scope.parent.parameters)
}
