module.exports = parse

var cheerio = require('cheerio'),
    Craft = require('./craft'),
    Script = require('./script'),
    Stack = require('./stack'),
    Row = require('./row')

function parse(xml) {

    var c = new Craft()
    var $ = cheerio.load(xml)

    var topCraftNode = $('craft')[0]
    var contentNodes = topCraftNode.children

    var contents = parseContentNodes($, contentNodes)

    c.contents = contents
    return c
}

function parseContentNodes($, contentNodes){
    var contents = []
    contentNodes.forEach(function(node) {
        if (node.name === 'script') {
            var script = new Script()
            script.text = $(node).text()
            script.type = $(node).attr('type')
            contents.push(script)
        }else if (node.name === 'stack'){
            var stack = new Stack()
            contents.push(stack)
            stack.contents = parseContentNodes($, node.children)
        }else if (node.name === 'row'){
            var row = new Row()
            contents.push(row)
            row.contents = parseContentNodes($, node.children)
        }
    })
    return contents
}