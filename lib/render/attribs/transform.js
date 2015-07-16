import _ from 'lodash'

export default function applyAttributeTransform(solid, element, scope) {
    let code = element.attribs['transform'] ||  element.attribs['t'] || ''
    code = scope.resolve(code)
    solid.transformEval(code)
}
