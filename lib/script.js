'strict'

module.exports = Script

var $$$ = require('craft-scad'),
    addWith = require('with'),
    Solid = require('./solid'),
    _ = require('lodash')

function Script() {
    this.text
    this.type
    this.contents = []
}

Script.prototype.execute = function(scope){    
    var ret = {}

    var env = _.merge($$$, {
        craft: scope
    })
    // console.log("env",_.methods(scope))
    var code = addWith('env', this.text + '; ret.val = main();')
    eval(code)
    return ret.val
}

Script.prototype.render = function(scope) {

    var csg = this.execute(scope)
    var solid = new Solid()
    solid.csg = csg
    // TODO: handle error

    solid.layout = computeLayout(csg)
    return solid
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
        x: cb[0].x,
        y: cb[0].y,
        z: cb[0].z,
        width: cb[1].x - cb[0].x,
        height: cb[1].y - cb[0].y,
        depth: cb[1].z - cb[0].z
    }
}