import Promise from 'bluebird'
import _ from 'lodash'
import opentype from 'opentype.js'
import parse from '../parse'
import Solid from '../solid'
import request from 'request'

import axios from 'axios'

export default function render_text(render, element, scope) {

    // console.log(element)
    let string = scope.resolve(element.data.trim())

    console.log(element.parent.name)

    scope.solid.name = 'text'
    scope.solid.role = 'merge'

    // console.log('text', string)

    // console.log('font style', scope.computeStyle(element.parent), element.parent.style)

    // use style from its parent
    // let style = element.parent.style//scope.computeStyle(element.parent)
    let style = scope.solid.parent.style

    // scope.computeStyle('span')

    let fontName = style['font-family'] //|| 'Roboto-Regular'
    // let fontUrl = `http://127.0.0.1:8080/fonts/${fontName}.ttf`
    let fontUrl = `http://cdn.craftml.io/fonts/${fontName}.ttf`
        
    let fontSize
    if (style['font-size']){
        fontSize = Number(style['font-size'])
    } else {
        fontSize = 12
    }

    function _do_render(font) {


            // Use your font here.

            // console.log(font)


            let words = string.split(/\s/)
            //console.log('words', words.length)

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
                        // console.log(svg)
                        let xml = '<solidify>' + svg + '</solidify>'
                        // console.log(svg)
                        return parse(xml)
                            .then(c => {
                                return render(c)
                            })

                    }))
                    .then(solids => {

                        // console.log('ret', solids.length)

                        // for each letter
                        _.forEach(solids, s => {

                            s.name = 'char'

                            // for each component of the letter
                            _.forEach(s.children, c =>{
                                // attach the style information
                                c.style = style
                            })
                        })

                        let g = Solid.fromGroup(solids)
                        g.name = 'word'
                        scope.solid.add(g)
                        // scope.solid.pp()
                    })
            }

            return Promise
                .all(_.map(words, word => {
                    return render_word(word)
                }))
                .then(()=>{

                    _.forEach(scope.solid.children, c => {
                        c.translate(0,10,0)
                    })

                    scope.solid.layoutEval('lineupX(2)')
                    scope.solid.fitToChildren()
                    scope.solid.applyStyleRecursively(scope.css)

                    return scope.solid
                })
        }

    return new Promise((resolve, reject) => {

        request(fontUrl, {encoding: null}, function(err, res, body){

            // console.log(body)
            let font = opentype.parse(toArrayBuffer(body))

            if (err) {
                console.log('Could not load font: ' + err)
                reject(err)

            } else {

                resolve(_do_render(font))

            }

        })
    })

}

function toArrayBuffer(buffer) {
    var arrayBuffer = new ArrayBuffer(buffer.length);
    var data = new Uint8Array(arrayBuffer);
    for (var i = 0; i < buffer.length; i += 1) {
        data[i] = buffer[i];
    }

    return arrayBuffer;
}
