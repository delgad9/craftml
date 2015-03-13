var $ = require('cheerio'),
    Promise = require("bluebird"),
    _ = require('lodash')

var loader = require('./loader')

module.exports = parse

function parse(xml, context) {
    // https://github.com/cheeriojs/cheerio/issues/598
    // set recognizeSelfClosing to true in order to handle self-closing tags, like <cube/>
    // https://github.com/fb55/htmlparser2/wiki/Parser-options
    // don't set xmlMode: true, otherwise Script does not get parsed properly
    var c = $.load(xml, {
        recognizeSelfClosing: true,
        lowerCaseAttributeNames: false
    })
    var root = c.root().children()

    if (context === undefined) {
        context = {
            basePath: process.cwd()
        }
    }
    
    return _parse(root, context)
        .then(function(ret) {
            return ret.length === 1 ? ret[0] : ret
        })        
}

function _load_and_parse_external_file(node, context) {

    var loadPromise

    if (node.attribs.module) {

        var moduleId = node.attribs.module
        loadPromise = loader.module(context, moduleId)

    } else if (node.attribs.src) {

        var src = node.attribs.src
        loadPromise = loader.src(context, src)
    }

    if (loadPromise) {

        return loadPromise
            .then(function(file) {
                return parse(file.contents, file.context)
            })
            .then(function(parsed) {

                // add importer's attributes
                parsed.attribs = node.attribs
                return parsed
            })
    }
}

function _parse(arg, context) {

    if ('length' in arg) {

        var nodes = $(arg).toArray()
        return Promise
            .map(nodes, function(node) {
                return _parse(node, context)
            })
            .then(_.compact)

    } else {

        var node = arg

        if (node.type === 'tag') {

            if (node.name === 'craft' && (node.attribs.src || node.attribs.module)) {

                return _load_and_parse_external_file(node, context)

            } else {

                var element = {}
                element.type = 'tag'
                element.name = node.name
                element.attribs = node.attribs

                return _parse(node.children, context)
                    .then(function(c) {
                        element.children = c
                        return element
                    })
            }

        } else if (node.type === 'script') {

            var element = {}
            if (node.attribs['type'] === 'text/openjscad') {
                element.type = 'factory'
            } else if (node.attribs['type'] === 'text/craftml') {
                element.type = 'script'
            }

            if (node.attribs.src) {

                var src = node.attribs.src
                // console.log(context)
                return loader
                    .src(context, src)
                    .then(function(file) {
                        element.path = file.path
                        element.code = file.contents
                        return element
                    })

            } else {

                element.code = $(node).text()
                return element
            }

        } else if (node.type === 'text') {

            // trim white spaces
            var text = node.data.trim()

            // if still some text
            if (text.length > 0) {
                var element = {}
                element.type = 'tag'
                element.name = 'text'
                element.attribs = {
                    text: text
                }
                return element

            } else {
                return new Promise(function(resolve, reject) {
                    resolve(null)
                })
            }

        }

    }
}