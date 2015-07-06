import Promise from 'bluebird'
import _ from 'lodash'
import opentype from 'opentype.js'
import parse from '../parse'
import Solid from '../solid'

export default function render_text(render, element, scope) {

    // console.log(element)
    let string = scope.resolve(element.data.trim())

    // console.log('font style', scope.computeStyle(element.parent), element.parent.style)

    // use style from its parent
    let style = element.parent.style//scope.computeStyle(element.parent)
    // scope.computeStyle('span')

    let fontName = style['font-family'] //|| 'Roboto-Regular'
    // let fontUrl = `http://127.0.0.1:8080/fonts/${fontName}.ttf`
    let fontUrl = `http://cdn.craftml.io/fonts/${fontName}.ttf`

    function _do_render(font) {


            // Use your font here.

            // console.log(font)
            let fontSize
            if (style['font-size']){
                fontSize = Number(style['font-size'])
            } else {
                fontSize = 12
            }

            let words = string.split(/\s/)

            function render_word(word){
                let p = font.getPath(word, 0, 0, fontSize)

                let commands = p.commands

                // break into groups, each group ends with 'Z'
                let groups = []
                let rest = commands
                let i
                while (true){
                    let i = _.findIndex(rest, {type: 'Z'})
                    if (i != -1){
                        groups.push(_.take(rest, i+1))
                        rest = _.slice(rest, i+1)
                    } else {
                        break
                    }
                }

                return Promise
                    .all(_.map(groups, group => {

                        p.commands = group
                        let svg = p.toSVG()
                        let xml = '<solidify>' + svg + '</solidify>'

                        return parse(xml)
                            .then(c => {
                                return render(c, scope)
                            })
                            .then(_.first)

                    }))
                    .then(solids => {
                        // for each letter
                        _.forEach(solids, s => {
                            // for each component of the letter
                            _.forEach(s.children, c =>{
                                // attach the style information
                                c.style = style
                            })
                        })
                        return Solid.fromGroup(solids)
                    })
            }

            return Promise
                .all(_.map(words, word => {
                    return render_word(word)
                }))
                // .then(wordSolids => {
                //     return Solid.fromGroup(wordSolids)
                // })
        }

    return new Promise((resolve, reject) => {

        opentype.load(fontUrl, function(err, font){

            if (err) {
                console.log('Could not load font: ' + err)

                reject(err)

            } else {

                resolve(_do_render(font))

            }

        })
    })



}
