'strict'

var cheerio = require('cheerio'),
    $$$ = require('craft-scad'),
    addWith = require('with'),
    _ = require('lodash')

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


function Craft() {
    this.contents = []
}

Craft.prototype.render = function() {

    var solids = this.contents.map(function(block) {
        return block.render()
    })

    var group = new SolidGroup()
    group.children = solids
    group.fitToChildren()
    return group
}

function Script() {
    this.text
    this.type
}

function computeLayout(csg) {
    var cb = csg.getBounds()
    var layout = {}
    return {
        x: cb[0].x,
        y: cb[0].y,
        z: cb[0].z,
        width: cb[1].x - cb[0].x,
        height: cb[1].y - cb[0].y,
        depth: cb[1].z - cb[0].z
    }
}

Script.prototype.render = function() {
    var ret = {}
    var code = addWith('$$$', this.text + '; ret.csg = main();')
    eval(code)

    var solid = new Solid()
    solid.csg = ret.csg
    // TODO: handle error

    solid.layout = computeLayout(ret.csg)
    return solid
}

// what render() should return
function Solid() {
    this.layout = {
        x: 0,
        y: 0,
        z: 0
    }
}

function SolidGroup() {
    this.children = []
    this.layout = {
        x: 0,
        y: 0,
        z: 0
    }
}


function collect_csgs(solid, acc) {
    if (solid.csg) {
        return acc.push(solid.csg)
    } else {
        return solid.children.forEach(function(s) {
            return collect_csgs(s, acc)
        })
    }
}

function toStl(){
    var csgs = []
    collect_csgs(this, csgs)
    return $$$.union(csgs).toStlString()
}

SolidGroup.prototype.toStl = toStl
// function() {
//     var csgs = []
//     collect_csgs(this, csgs)
//     return $$$.union(csgs).toStlString()
// }


Solid.prototype.toStl = toStl
// function() {
//     var csgs = []
//     collect_csgs(this, csgs)
//     return $$$.union(csgs).toStlString()
// }

SolidGroup.prototype.fitToChildren = function() {

    var xrange = {}
    var yrange = {}
    var zrange = {}
    xrange.min = _.min(this.children.map(function(c) {
        return c.layout.x
    }))
    xrange.max = _.max(this.children.map(function(c) {
        return c.layout.x + c.layout.width
    }))
    yrange.min = _.min(this.children.map(function(c) {
        return c.layout.y
    }))
    yrange.max = _.max(this.children.map(function(c) {
        return c.layout.y + c.layout.height
    }))
    zrange.min = _.min(this.children.map(function(c) {
        return c.layout.z
    }))
    zrange.max = _.max(this.children.map(function(c) {
        return c.layout.z + c.layout.depth
    }))

    this.layout.height = yrange.max - yrange.min
    this.layout.width = xrange.max - xrange.min
    this.layout.depth = zrange.max - zrange.min
}

function Row(contents) {
    this.contents = contents
}

Row.prototype.render = function() {
    var solids = this.contents.map(function(block) {
        return block.render()
    })

    // do layout
    var tx = 0
    solids.forEach(function(solid) {
        solid.layout.x = tx
        tx = tx + solid.layout.width
    })

    var group = new SolidGroup()
    group.children = solids
    group.fitToChildren()

    return group
}

var lib = {
    parse: parse,
    Script: Script,
    Solid: Solid,
    SolidGroup: SolidGroup,
    Row: Row
}
module.exports = lib