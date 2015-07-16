import _ from 'lodash'

export default function applyAttributeTransform(solid, element, scope) {
    let code = element.attribs['transform'] ||  element.attribs['t'] || ''
    code = scope.resolve(code)

    // console.log('merged', solid.getMerged())

    // solid.pp()

    // let ms = solid.getMerged()
    // _.forEach(ms, m => {
    //     m.transformEval(code)
    // })

    solid.transformEval(code)

    // TODO: what do we do with multiple merged nodes?
}
