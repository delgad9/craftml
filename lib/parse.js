var  Promise = require("bluebird"),
    _ = require('lodash')

var loader = require('./loader')
var Element = require('./element')

var htmlparser = require("htmlparser2");

module.exports = parse

function parse(xml, context) {

    if (xml === undefined) {
        return Promise.resolve([])
    }

    if (context === undefined) {
        context = {
            basePath: process.cwd()
        }
    }

    return new Promise(function(resolve, reject) {

            var handler = new htmlparser.DomHandler(
                function(error, dom) {
                    resolve(dom)
                }, {
                    // get the start index so we can report a better error message
                    // referring to a line
                    withStartIndices: true
                })
            var parser = new htmlparser.Parser(handler, {
                recognizeSelfClosing: true,
                lowerCaseAttributeNames: false
            })
            parser.write(xml)
            parser.end()

        })
        .then(function(dom) {
            return _parse(dom, context)
        })
        .then(function(parsed) {
            return parsed.length === 1 ? parsed[0] : parsed
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

    } else if (node.attribs.stl) {

        var src = node.attribs.stl
        loadPromise = loader.src(context, src, 'binary')
            .then(function(file) {

                // construct a 'craft' element
                // containing the stl element
                var stlElement = new Element()
                stlElement.type = 'tag'
                stlElement.name = 'stl'
                stlElement.attribs = {
                    contents: file.contents,
                    src: src
                }

                var element = new Element()
                element.type = 'tag'
                element.name = 'craft'
                element.attribs = node.attribs
                element.children = [stlElement]
                return element
            })
        return loadPromise

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

        var nodes = arg//$(arg).toArray()
        var childContext = _.clone(context)
        return Promise
            .map(nodes, function(node) {
                return _parse(node, childContext)
            })
            .then(_.compact)

    } else {

        var node = arg

        // console.log(node.type)

        if (node.type === 'tag') {

            if (node.name === 'craft' &&
                (node.attribs.src || node.attribs.module || node.attribs.stl || node.attribs.gist)) {
                var childContext = _.clone(context)
                return _load_and_parse_external_file(node, childContext)

            } else {

                // var element = new Element('tag', node.name, node.attribs)
                node.prototype = Element.prototype
                //
                var childContext = _.clone(context)

                return _parse(node.children, childContext)
                    .then(function(c) {
                        node.children = c
                        return node
                    })
            }

        } else if (node.type === 'script') {

            var element = new Element('script', node.name, node.attribs)

            if (node.attribs.src) {

                var src = node.attribs.src
                return loader
                    .src(context, src)
                    .then(function(file) {
                        element.path = file.path
                        element.code = file.contents
                        return element
                    })

            } else {
                // element.code = node.children[0].data
                node.code = node.children[0].data
                // node.prototype = Element.prototype
                return node
            }

        } else if (node.type === 'text') {

            // trim white spaces
            var text = node.data.trim()

            // if still some text
            if (text.length > 0) {
                // var element = new Element('tag', 'text', {})
                // element.type = 'tag'
                // element.name = 'text'
                // element.attribs = {
                //     text: text
                // }
                return node

            } else {

                return Promise.resolve(null)

            }

        } else if (node.type === 'style'){
            return node
        }

    }
}
