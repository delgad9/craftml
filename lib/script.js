'strict'

module.exports = Script

var $$$ = require('craft-scad'),
    addWith = require('with'),
    Solid = require('./solid')

function Script() {
    this.text
    this.type
    this.contents = []
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
