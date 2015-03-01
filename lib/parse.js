var cheerio = require('cheerio'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
    Promise = require("bluebird")

module.exports = parse

function parse(xml, context) {
    // https://github.com/cheeriojs/cheerio/issues/598
    // set recognizeSelfClosing to true in order to handle self-closing tags, like <cube/>
    // https://github.com/fb55/htmlparser2/wiki/Parser-options
    // don't set xmlMode: true, otherwise Script does not get parsed properly
    var $ = cheerio.load(xml, {
        recognizeSelfClosing: true,
        lowerCaseAttributeNames: false
    })
    var root = $.root().children()
        // console.log(root)

    if (context === undefined) {
        context = {
            basePath: process.cwd()
        }
    }

    var ret = parseNode($, root, context)
    if (ret.length === 1)
        return ret[0]
    else
        return ret
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

function parseNode($, nodes, context) {

    var elements = []

    for (var i = 0; i < nodes.length; ++i) {

        var node = nodes[i]

        if (node.type === 'tag') {



            if (node.name === 'craft' && node.attribs.module) {


                var modulePath = searchForModulePath(context.basePath, node.attribs.module)
                if (modulePath) {

                    var indexXml = path.join(modulePath, 'index.xml')
                    var contents = fs.readFileSync(indexXml, 'utf8')

                    context.basePath = modulePath
                    var element = parse(contents, context)

                    // use importer's attributes
                    element.attribs = node.attribs

                    elements.push(element)

                } else {

                    throw error('can not find module %s', modulePath)
                }

            } else {


                var element = {}
                element.type = 'tag'
                element.name = node.name
                element.attribs = node.attribs
                element.children = parseNode($, node.children, context)

                elements.push(element)

            }



        } else if (node.type === 'script') {

            var element = {}
            if (node.attribs['type'] === 'text/openjscad') {

                element.type = 'factory'
                element.code = $(node).text()                
                elements.push(element)


            } else if (node.attribs['type'] === 'text/craftml') {

                element.type = 'script'
                element.code = $(node).text()                
                elements.push(element)
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

                elements.push(element)
            }

        }

    }

    return elements

}