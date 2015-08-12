import Promise from 'bluebird'
import css from 'css'
import _ from 'lodash'
import Solid from '../solid'

import {render, renderElementList} from './render'

export default function render_div($scope, $) {


    let innerScope = $scope.clone()

    let style = this.style
    
    let fontSize = style['font-size']

    // spacing: roughly 1/3 of the fontSize in px
    let spacing = Number(fontSize) / 3

    return renderElementList(this, this.src.children, innerScope)
        .then(() => {

            let words = this.children

            let lines = _group_by_lines(words, spacing, style['width'])
            // lines === [[s1,s2],[s3],[s4]...]

            // create a solid group for each line of solids
            let lineSolidArray = _.map(lines, line => {
                let lineSolid = Solid.fromGroup(line)
                lineSolid.name = 'g'
                lineSolid.attribs.class = 'craftml-line'
                lineSolid.layoutEval('lineupX(' + spacing + ')')
                return lineSolid
            })

            this.removeAll()
            _.forEach(lineSolidArray, s => {
                this.add(s)
            })

            this.layoutEval('lineupY(2)')

            let v
            if (v = style['text-align']){
                if (v == 'left'){
                    this.layoutEval('alignX(0%)')
                } else if (v == 'right'){
                    this.layoutEval('alignX(100%)')
                } else if (v == 'center'){
                    this.layoutEval('alignX(50%)')
                }
            } else {
                this.layoutEval('alignX(0%)')
            }

            this.translateTo(0,0,0)
            // this.pp()
        })
}

function _group_by_lines(solids, spacing, maxLength = Infinity){

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
