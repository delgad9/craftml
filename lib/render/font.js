import Promise from 'bluebird'
import _ from 'lodash'
import opentype from 'opentype.js'
import parse from '../parse'

export default function render_font(render, element, scope) {

    let string = scope.resolve(element.attribs['text'])

    return new Promise((resolve, reject) => {

        opentype.load('http://127.0.0.1:8080/fonts/Roboto-Black.ttf', function(err, font) {

            if (err) {
                console.log('Could not load font: ' + err)

                reject(err)

            } else {
                // Use your font here.

                // console.log(font)
                var p = font.getPath(string, 0, 0, 30)
                // var gs = font.stringToGlyphs('Hello')

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

                let all = _.map(groups, group => {

                    p.commands = group
                    let svg = p.toSVG()
                    let xml = '<solidify>' + svg + '</solidify>'
                    console.log(svg)
                    return parse(xml)
                        .then(function(c) {
                            return render(c, scope)
                        })
                })

                Promise.all(all)
                    .then(ret => {
                        console.log(ret)
                        resolve(ret)
                    })
                // console.log(i)
                // console.log(_.take(p.commands, i+1))
                //
            }
        })

    })



}
