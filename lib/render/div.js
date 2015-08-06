import Promise from 'bluebird'
import css from 'css'
import _ from 'lodash'
import Solid from '../solid'

import q from '../query'

import {render, renderElementList} from './render'

export default function render_div($element, $scope) {

    let [cssText = ''] = [$element.attribs['style']]

    let ast = css.parse('div {' + cssText + '}')

    let innerScope = $scope.clone()


    let style = this.style

    //console.log(style)
    let fontSize = style['font-size']

    // spacing: roughly 1/3 of the fontSize in px
    let spacing = Number(fontSize) / 3


    function _group_by_lines(solids, maxLength = Infinity){

        let allLineSolids = []
        let rest = solids.slice(0)
        while (true){

            let currentLength = 0

            let solidsThatFitThisLine =
                _.takeWhile(rest, s => {

                    let notBlock = s.style['display'] != 'block'
                    let solidLength = s.size.x

                    currentLength = currentLength + solidLength + spacing
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

    //computeStyle(element)

    return renderElementList(this, $element.children, innerScope)
        .then(() => {

            // console.log('s', solids)

            let solids = this.children

            let $ = q(this)

            let words = this.children
            // console.log('words', words.length)

            let lines = _group_by_lines(words, style['width'])
            // lines === [[s1,s2],[s3],[s4]...]

            // create a solid group for each line of solids
            let lineSolidArray = _.map(lines, line => {
                // console.log(line)
                let lineSolid = Solid.fromGroup(line)
                lineSolid.name = 'text-line'
                lineSolid.layoutEval('lineupX(' + spacing + ')')
                return lineSolid
            })

            let paragraphSolid = Solid.fromGroup(lineSolidArray)
            paragraphSolid.name = 'p'
            paragraphSolid.layoutEval('lineupY(2)')

            let v
            if (v = style['text-align']){
                if (v == 'left'){
                    paragraphSolid.layoutEval('alignX(0%)')
                } else if (v == 'right'){
                    paragraphSolid.layoutEval('alignX(100%)')
                } else if (v == 'center'){
                    paragraphSolid.layoutEval('alignX(50%)')
                }
            } else {
                paragraphSolid.layoutEval('alignX(0%)')
            }

            this.removeAll()
            paragraphSolid.translateTo(0,0,0)
            this.add(paragraphSolid)
            // return paragraphSolid

        })
}
