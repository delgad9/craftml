var debug = require('debug')('craft.parse')
module.exports = parse

var cheerio = require('cheerio'),
    _ = require('lodash'),
    Craft = require('./craft'),
    CraftRef = require('./craftref'),
    Script = require('./script'),
    Stack = require('./stack'),
    Row = require('./row')

function parse(xml) {


    var $ = cheerio.load(xml)

    var topCraftNode = $('craft')[0]
    var contentNodes = topCraftNode.children

    var ret =  parseNode($, topCraftNode)
    debug(JSON.stringify(ret))
    return ret
}


function createFrom($, node) {
    if (node.name === 'script') {
        script = new Script()
        script.text = $(node).text()
        script.type = $(node).attr('type')
        return script
    } else if (node.name === 'stack') {
        return new Stack()
    } else if (node.name === 'row') {
        return new Row()
    } else if (node.name === 'craft') {
        var c = new Craft()
        c.name = node.attribs.name
        return c
    } else if (node.name){
        var c = new CraftRef(node.name)
        return c
    }
}

// return a part
function parseNode($, node) {
    var craft = createFrom($, node)
    if (craft && node.children) {
        var contents = []
        node.children.forEach(function(child) {
            var childCraft = parseNode($, child)
            if (childCraft){                
               contents.push(childCraft)
            }
        })
        craft.contents = contents
        return craft
    }
}