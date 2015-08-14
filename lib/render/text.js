import Promise from 'bluebird'
import _ from 'lodash'
import opentype from 'opentype.js'
import parse from '../parse'
import Solid from '../solid'
import request from 'request'

import {renderElementList} from './render'
import render from './render'

function toArrayBuffer(buffer) {
    var arrayBuffer = new ArrayBuffer(buffer.length);
    var data = new Uint8Array(arrayBuffer);
    for (var i = 0; i < buffer.length; i += 1) {
        data[i] = buffer[i];
    }

    return arrayBuffer;
}

let cached_fonts = {}

let load_font_memoized = _.memoize(load_font, (fontName) => {return fontName})

function load_font(fontName){
    let fontUrl = `http://cdn.craftml.io/fonts/${fontName}.ttf`

    if (fontUrl in cached_fonts){

        return Promise.resolve(cached_fonts[fontUrl])

    } else {

        return new Promise((resolve, reject) => {

            console.log(`loading font from ${fontUrl}`)

            if (typeof XMLHttpRequest != 'undefined'){

                var xhr = new XMLHttpRequest();
                xhr.open('get', fontUrl, true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    if (xhr.status !== 200) {
                        reject('Font could not be loaded: ' + xhr.statusText);
                    }
                    let font = opentype.parse(xhr.response)
                    resolve(font)
                }
                xhr.send()

            } else  {

                 request(fontUrl, {encoding: null}, (err, res, body) => {

                    let font = opentype.parse(toArrayBuffer(body))

                    if (err) {

                        reject(err)

                    } else {

                        resolve(font)

                    }

                })

            }
        })
        .then(font => {
            cached_fonts[fontUrl] = font
            return font
        })

    }

}



function word_xml(word, font, fontSize) {

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

    let chars = _.map(groups, group => {
        p.commands = group
        let svg = p.toSVG()
        let xml = `<g class="craftml-char"><solidify>${svg}</solidify></g>`
        return xml
    })

    let xml = `<g class="craftml-word">${chars.join('')}</g>`
    return xml
}

export default function render_text($scope, $) {

    let string = '' + $scope.resolve(this.src.data.trim())

    this.name = 'text'
    this.role = 'merge'

    // use style from its parent
    let style = this.parent.style

    let fontName = style['font-family']
    let fontSize
    if (style['font-size']){
        fontSize = Number(style['font-size'])
    } else {
        fontSize = 12
    }

    return load_font_memoized(fontName)
        .then(font => {

            let words = string.split(/\s/)

            let words_xml = _.map(words, word => {
                return word_xml(word, font, fontSize)
            }).join('')

            let xml = `<g grouping="off">${words_xml}</g>`
            this.add(xml)
            return Promise.all(this.promises)
        })
        .then(()=>{

            _.forEach(this.children, c => {
                c.translate(0,10,0)
            })

            this.layoutEval('lineupX(' + fontSize/3 + ')')
            this.fitToChildren()
            this.applyStyleRecursively($scope.css)
            return this
        })
}
