export default function layout_attribute(solid, element, scope) {
    let code = solid.attribs['layout'] || solid.attribs['l']  || ''
    solid.layoutEval(code)
}
