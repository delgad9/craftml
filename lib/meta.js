var _ = require('lodash'),
    htmlparser = require("htmlparser2"),
    Promise = require('bluebird'),
    CSSselect = require("css-select")

function parse(xml) {

    return new Promise(function(resolve, reject) {

        var handler = new htmlparser.DomHandler(
            function(error, dom) {
                resolve(dom)
            })

        var parser = new htmlparser.Parser(handler, {
            recognizeSelfClosing: true,
            lowerCaseAttributeNames: false
        })
        parser.write(xml)
        parser.end()
    })
}

// <info>
//     <title>A Cube</title>
//     <version>1.0.5 </version>
//     <author> Tom Yeh </author>
//      any xml
// </info>
function _info(dom){

    var info_blocks = CSSselect(':root > info', dom)
    var info = {}

    _.forEach(info_blocks, function(b){

        _.forEach(b.children, function(c){

            var key = c.name

            if (c.children && c.children[0].data){
                var value = c.children[0].data.trim()
            }

            //console.log('c', c, 'name', c.name, 'children', c.children, 'value', value)
            // console.log()
            if (value)
                info[key] = value
        })

    })

    return info
}

function _parameters(dom){
    var s = CSSselect(':root > parameter', dom)
    return _.pluck(s, 'attribs')
}

function _crafts(dom){
    var s = CSSselect('craft', dom)
    return _.pluck(s, 'attribs')
}

function _contents(dom){
    var s = CSSselect('content', dom)
    return _.pluck(s, 'attribs')
}

module.exports = function extractMetaData(contents) {

    return parse(contents)
        .then(function(dom) {
            var meta = {}
            var name = dom[0].attribs['name']
            if (name)
                meta.name = name
            meta.parameters = _parameters(dom)
            meta.info = _info(dom)
            meta.crafts = _crafts(dom)
            meta.contents = _contents(dom)
            return meta
        })
}
