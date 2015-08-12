import _ from 'lodash'

export default function applyAttributeTransform(solid, element, scope) {
    let code = solid.attribs['transform'] ||  solid.attribs['t'] || ''
    solid.transformEval(code)
}
