var select = require('../select'),
    _ = require('lodash')

export default function layout_attribute(solid, element, scope) {
    console.log(scope.parameters)
    let code = element.attribs['layout'] || element.attribs['l']  || ''
    // code = scope.parent.resolve(code)
    code = scope.resolve(code)
    solid.layoutEval(code)//, scope.parameters)
}
