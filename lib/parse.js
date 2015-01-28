module.exports = parse

var cheerio = require('cheerio'),
    Craft = require('./craft'),
    Script = require('./script')

function parse(xml) {

    var c = new Craft()
    var $ = cheerio.load(xml)

    var topCraftNode = $('craft')[0]
    var contentNodes = topCraftNode.children

    var contents = []
    contentNodes.forEach(function(node) {
        if (node.name === 'script') {
            var script = new Script()
            script.text = $(node).text()
            script.type = $(node).attr('type')
            contents.push(script)
        }
    })

    c.contents = contents
    return c
}