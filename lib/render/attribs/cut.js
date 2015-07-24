export default function(solid, element, scope) {
    var selector = element.attribs['cut']
    solid.parent.layoutEval(`cut(${selector})`)
}
