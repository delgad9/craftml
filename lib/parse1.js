var cheerio = require('cheerio'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path')

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


var addWith = require('with'),
    $$$ = require('craft-scad'),
    Solid = require('./solid1')

function evalOpenJscadScript(params, code) {

    var ret = {}

    var env = _.merge($$$, {})

    var code = addWith('env', code + '; ret.val = main(params);')
    eval(code)
    var csg = ret.val

    if (csg.polygons === undefined) {
        throw 'openjscad does not return a csg ' + csg
    }

    var solid = new Solid()
    solid.csg = csg
    solid.layout = computeLayout(csg)
    return solid
}

function evalScript(code, params, scope) {

    var ret = {}

    var params = scope.parameters
    return eval(code + '; ret.val = main(params, scope);')
}

function computeLayout(csg) {
    var cb = csg.getBounds()
    var layout = {}
    return {
        size: {
            x: cb[1].x - cb[0].x,
            y: cb[1].y - cb[0].y,
            z: cb[1].z - cb[0].z
        },
        location: {
            x: cb[0].x,
            y: cb[0].y,
            z: cb[0].z
        }
        // width: cb[1].x - cb[0].x,
        // height: cb[1].y - cb[0].y,
        // depth: cb[1].z - cb[0].z
    }
}

function parseNode($, nodes, context) {

    var elements = []

    for (var i = 0; i < nodes.length; ++i) {

        var node = nodes[i]

        if (node.type === 'tag') {
            var element = {}
            element.type = 'tag'
            element.name = node.name
            element.attribs = node.attribs
            element.children = parseNode($, node.children, context)

            elements.push(element)

        } else if (node.type === 'script') {

            var element = {}
            if (node.attribs['type'] === 'text/openjscad') {

                element.type = 'factory'
                element.code = $(node).text()
                element.create = function(params) {

                    var solid =  evalOpenJscadScript(params, element.code)
                    return solid
                }

                elements.push(element)


            } else if (node.attribs['type'] === 'text/craftml') {        

                element.type = 'script'
                element.code = $(node).text()
                element.run = function(params, scope){
                    return evalScript(element.code, params, scope)                    
                }

                elements.push(element)
            }

        }

    }

    return elements

}