var cheerio = require('cheerio'),
    _ = require('lodash'),
    path = require('path'),
    Promise = require("bluebird")

var fs = Promise.promisifyAll(require('fs'))


var $ = require('cheerio')


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
        // console.log("ROOT",root)

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

function searchForModulePath(currentPath, name) {
    var modulePath = path.join(currentPath, 'node_modules', name)
    if (fs.existsSync(modulePath)) {

        return modulePath

    } else {

        if (currentPath === '/') {
            return undefined
        } else {
            return searchForModulePath(path.join(currentPath, '../'), name)
        }
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

            if (node.name === 'craft' && node.attribs.module) {


                var modulePath = searchForModulePath(context.basePath, node.attribs.module)
                if (modulePath) {

                    var indexXml = path.join(modulePath, 'index.xml')
                    return fs.readFileAsync(indexXml, 'utf8')
                        .then(function(contents) {

                            context.basePath = modulePath

                            return parse(contents, context)
                                .then(function(element) {

                                    // use importer's attributes
                                    element.attribs = node.attribs

                                    return element
                                })

                        })

                } else {

                    throw error('can not find module %s', modulePath)
                }

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
                return fs.readFileAsync(src, 'utf8')
                    .then(function(c) {
                        element.code = c
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