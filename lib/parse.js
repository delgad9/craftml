var  Promise = require("bluebird"),
    _ = require('lodash'),
    path = require('path')

var htmlparser = require("htmlparser2");

import urljoin from 'url-join'

export default function parse(context) {

    if (context === undefined) {
        context = {
            cwd: 'file:///' + process.cwd(),
            contents: xml
        }
    }
    
    context.engine = context.engine || {}
    _.defaults(context.engine, {api: 'http://craftml.io/api', cdn: 'http://cdn.craftml.io'})

    let xml = context.contents
    return new Promise(function(resolve, reject) {

            let handler = new htmlparser.DomHandler(
                function(error, dom) {
                    resolve(dom)
                }, {
                    // get the start index so we can report a better error message
                    // referring to a line
                    withStartIndices: true
                })
            let parser = new htmlparser.Parser(handler, {
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
            context.contents = xml
            return parse(context)
                .then(c => {
                    c.attribs['load'] = loader.lazy(moduleId, context)
                    node.children.push(c)
                    c.parent = node
                    return node
                })

        } else {

            let loadPromise =
                loader
                    .loadModule(moduleId, context)
                    .then(m =>{
                        return parse(m)
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

        let nodes = arg
        let childContext = _.clone(context)
        return Promise
            .map(nodes, function(node) {
                return _parse(node, childContext)
            })
            .then(_.compact)

    } else {

        let node = arg

        node.context = context

        if (node.type === 'tag') {

            let childContext = _.clone(context)

            if (node.name === 'craft' &&
                (node.attribs.src || node.attribs.module || node.attribs.stl || node.attribs.gist)) {

                return _load_and_parse_external_file(node, childContext)

            } else {

                return _parse(node.children, childContext)
                    .then(c =>{
                        node.children = c
                        return node
                    })
            }

        } else if (node.type === 'script') {

            if (node.attribs.src) {

                let src = node.attribs.src
                return loader
                    .loadSrc(context, src)
                    .then(file => {
                        node.path = file.path
                        node.code = file.contents
                        return node
                    })

            } else {
                if (node.children.length > 0){
                    node.code = node.children[0].data
                } else {
                    node.code = ''
                }
                return node
            }

        } else if (node.type === 'text') {

            let text = node.data.trim()
            // if still some text
            if (text.length > 0) {
                node.name = 'text'
                return node
            } else {
                return Promise.resolve(null)
            }

        } else if (node.type === 'style'){
            return node

        } else {
            // node.type === 'comment'
            return null
        }
    }
}
