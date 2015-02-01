var debug = require('debug')('craft.parse')
module.exports = parse

var cheerio = require('cheerio'),
    _ = require('lodash'),
    fs = require('fs'),
    path = require('path')


var Craft = require('./craft'),
    CraftRef = require('./craftref'),
    Script = require('./script'),
    Stack = require('./stack'),
    Row = require('./row'),
    Place = require('./place'),
    TextElement = require('./text')

function parse(xml, basePath) {
    // https://github.com/cheeriojs/cheerio/issues/598
    // set xmlMode to true in order to handle self-closing tags, like <cube/>
    var $ = cheerio.load(xml, {
        xmlMode: true
    })
    var topCraftNode = $('craft')[0]
    var ret = parseNode($, topCraftNode, basePath)
    debug('parsed: %o', ret)
    return ret
}

function parseFromFile(src) {
    var xml = fs.readFileSync(src, 'utf8')
    return parse(xml)
}


function createScript(node, $) {
    script = new Script()
    script.text = $(node).text()
    script.type = $(node).attr('type')
    return script
}

function createCraftRef(node) {
    var c = new CraftRef(node.name)
    return c
}

function createCraft(node, basePath) {
    var c
    if ('src' in node.attribs) {

        var src = path.join(basePath || '', node.attribs.src)
        debug('import from %s, %s', src, basePath)
        c = parseFromFile(src)

    } else if ('module' in node.attribs) {

        var o = require(node.attribs.module)
        debug('module loaded: %o', o)

        var basePath = path.dirname(o.path)
        c = parse(o.contents, basePath)

        // TODO: handle module not found error

    } else {
        c = new Craft()
    }
    // TODO: handle error when both src and module are specified
    return c
}

function node2block($, node, basePath) {
    debug('node.type: %s', node.type)
    if (node.type === 'tag') {
        if (node.name === 'stack') {
            return new Stack()
        } else if (node.name === 'row') {
            return new Row()
        } else if (node.name === 'craft') {
            return createCraft(node, basePath)
        } else if (node.name === 'place') {
            return new Place()
        } else if (node.name) {
            return createCraftRef(node)
        }
    } else if (node.type === 'text') {
        if (node.data.trim().length > 0)
            return new TextElement(node.data)
    } else if (node.type === 'script') {

        if (node.name === 'script') {
            return createScript(node, $)
        }
    }
}

// return a part
function parseNode($, node, basePath) {
    var block = node2block($, node, basePath)

    if (node.attribs && 'name' in node.attribs) {
        block.name = node.attribs.name
    }

    if (block) {
        if (node.children) {
            node.children.forEach(function(child) {
                var childBlock = parseNode($, child, basePath)
                if (childBlock) {
                    block.contents.push(childBlock)
                }
            })
        }
        return block
    }
}