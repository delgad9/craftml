var debug = require('debug')('craft.parse')
module.exports = parse

var cheerio = require('cheerio'),
    _ = require('lodash'),
    fs = require('fs')


var Craft = require('./craft'),
    CraftRef = require('./craftref'),
    Script = require('./script'),
    Stack = require('./stack'),
    Row = require('./row')

function parse(xml) {
    // https://github.com/cheeriojs/cheerio/issues/598
    // set xmlMode to true in order to handle self-closing tags, like <cube/>
    var $ = cheerio.load(xml, {xmlMode: true})
    var topCraftNode = $('craft')[0]
    var ret = parseNode($, topCraftNode)
    debug('parsed: %o', ret)
    return ret
}

function parseFromFile(src) {
    var xml = fs.readFileSync(src, 'utf8')
    return parse(xml)
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
        
        var c
        if ('src' in node.attribs) {
            debug('import from %s', node.attribs.src)
            c = parseFromFile(node.attribs.src)
        }else{
            c = new Craft()
        }
        if ('name' in node.attribs){
           c.name = node.attribs.name
        }
        // TODO: handle error when both src and module are specified
        return c
    } else if (node.name) {
        var c = new CraftRef(node.name)
        return c
    }
}

// return a part
function parseNode($, node) {
    var block = createFrom($, node)
    debug('block:', block)
    if (block) {
        if (node.children){
            node.children.forEach(function(child) {
                var childBlock = parseNode($, child)
                if (childBlock) {
                    block.contents.push(childBlock)
                }
            })
        }
        return block        
    }
}