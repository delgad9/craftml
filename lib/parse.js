var  Promise = require("bluebird"),
    _ = require('lodash'),
    path = require('path')

// var loader = require('./loader')
// var Element = require('./element')
var htmlparser = require("htmlparser2");

import urljoin from 'url-join'

export default function parse(xml, context) {

    if (xml === undefined) {
        return Promise.resolve([])
    }

    if (context === undefined) {
        context = {
            basePath: 'file:///' + process.cwd()
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


import * as loader from './loader'

function _load_and_parse_external_file(node, context) {

    var loadPromise
    if (node.attribs.module) {

        var moduleId = node.attribs.module

        if (moduleId.match(/\.\/(.*\.stl)/)){
            let xml = '<stl></stl>'
            return parse(xml, context)
                .then(c => {
                    // console.log(file)

                    // ./foo.stl -> foo.stl
                    moduleId = moduleId.match(/\.\/(.*\.stl)/)[1]

                    let url = urljoin(context.basePath, moduleId)
                    console.log(url)//context.basePath)
                    c.attribs['load'] = loader.get(url, context),
                    c.attribs['url'] = url
                    node.children.push(c)
                    c.parent = node
                    return node
                })

        } else {

            let loadPromise =
                loader
                    .loadModule(moduleId, context)
                    .then(file =>{
                        return parse(file.contents, file.context)
                    })
                    .then(parsed => {

                        // importer's attributes take precendence
                        // the order is important!!
                        parsed.attribs = _.defaults(node.attribs, parsed.attribs)
                        return parsed
                    })

            return loadPromise
        }

    } else if (node.attribs.src) {

        var src = node.attribs.src
        loadPromise = loader.src(context, src)

    }
    // } else if (node.attribs.stl) {
    //
    //     var src = node.attribs.stl
    //     loadPromise = loader.src(context, src, 'binary')
    //         .then(function(file) {
    //
    //             let xml = '<stl></stl>'
    //             return parse(xml, context)
    //                 .then(c => {
    //                     c.attribs['contents'] = file.contents
    //                     c.attribs['src'] = src
    //                     node.children.push(c)
    //                     c.parent = node
    //                     return node
    //                 })
    //         })
    //
    //     return loadPromise
    //
    // }

    if (loadPromise) {

        return loadPromise
            .then(function(file) {
                return parse(file.contents, file.context)
            })
            .then(function(parsed) {

                // importer's attributes take precendence
                // the order is important!!
                parsed.attribs = _.defaults(node.attribs, parsed.attribs)
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
                // node.prototype = Element.prototype
                //
                var childContext = _.clone(context)

                return _parse(node.children, childContext)
                    .then(function(c) {
                        node.children = c
                        return node
                    })
            }

        } else if (node.type === 'script') {

            // var element = new Element('script', node.name, node.attribs)

            if (node.attribs.src) {

                var src = node.attribs.src
                return loader
                    .src(context, src)
                    .then(function(file) {
                        node.path = file.path
                        node.code = file.contents
                        return node
                    })

            } else {
                // element.code = node.children[0].data
                if (node.children.length > 0){
                    node.code = node.children[0].data
                } else {
                    node.code = ''
                }
                // node.prototype = Element.prototype
                return node
            }

        } else if (node.type === 'text') {

            // trim white spaces
            var text = node.data.trim()

            // node.attribs = {}
            // node.style = {}



            // if still some text
            if (text.length > 0) {
                // var element = new Element('tag', 'text', {})
                // element.type = 'tag'
                // element.name = 'text'
                // element.attribs = {
                //     text: text
                // }
                node.name = 'text'
                return node

            } else {

                //console.log(node.parent)
                // _.remove(node.parent.children, node)// node.type = 'ignore'
                return Promise.resolve(null)

            }

        } else if (node.type === 'style'){
            return node
        }

    }
}
