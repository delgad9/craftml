var select = require('../select'),
    _ = require('lodash')

export default function layout_attribute(solid, element, scope) {
    let code = element.attribs['layout'] || element.attribs['l']  || ''
    code = scope.resolve(code)
    solid.layoutEval(code)
}
