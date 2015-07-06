import Promise from 'bluebird'
import css from 'css'
import _ from 'lodash'
import Solid from '../solid'

export default function render_div(render, element, scope) {

    let [cssText = ''] = [element.attribs['style']]

    let ast = css.parse('div {' + cssText + '}')

    let innerScope = scope.clone()

    _.extend(innerScope.style, element.style)

    _.forEach(ast.stylesheet.rules[0].declarations, decl => {
        innerScope.style[decl.property] = decl.value
    })

    // console.log(innerScope.style)

    function _group_by_lines(solids, maxLength = Infinity){

        let allLineSolids = []
        let rest = solids.slice(0)
        while (true){

            let currentLength = 0

            let solidsThatFitThisLine =
                _.takeWhile(rest, s => {

                    let notBlock = s.style['display'] != 'block'
                    let solidLength = s.layout.size.x

                    currentLength = currentLength + solidLength
                    return currentLength <= maxLength && notBlock
                })

            if (solidsThatFitThisLine.length === 0){
                // if the first remaining solid can not fit within a line
                // just add it and let it go over the line
                solidsThatFitThisLine.push(_.first(rest))
            }

            let thisLineSolid = solidsThatFitThisLine
            allLineSolids.push(thisLineSolid)

            rest = _.slice(rest, solidsThatFitThisLine.length)
            if (rest.length == 0){
                break
            }

        }

        return allLineSolids
    }

    let style = scope.computeStyle(element)

    return render(element.children, innerScope)
        .then(solids => {

            let lines = _group_by_lines(solids, style['width'])
            // lines === [[s1,s2],[s3],[s4]...]

            // create a solid group for each line of solids
            let lineSolidArray = _.map(lines, line => {
                let lineSolid = Solid.fromGroup(line)
                lineSolid.layoutEval('lineupX(5)')
                return lineSolid
            })


            let paragraphSolid = Solid.fromGroup(lineSolidArray)
            paragraphSolid.layoutEval('lineupY(5)')

            let v
            if (v = style['text-align']){
                if (v == 'left'){
                    paragraphSolid.layoutEval('alignX(0%)')
                } else if (v == 'right'){
                    paragraphSolid.layoutEval('alignX(100%)')
                } else if (v == 'center'){
                    paragraphSolid.layoutEval('alignX(50%)')
                }
            }


            return paragraphSolid

        })
}
