export default function(solid, element, scope) {
    if ('cut' in element.attribs){
        let selector = element.attribs['cut']
        solid.parent.layoutEval(`cut(${selector})`)
    }
}
