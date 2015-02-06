'strict'

module.exports = Script

var $$$ = require('craft-scad'),
    addWith = require('with'),
    Element = require('./element')
    Solid = require('./solid'),
    _ = require('lodash')

function Script(type, text) {
    Element.apply(this)
    this.type = 'craft'
    this.text = text
}

Script.prototype = new Element()
Script.prototype.constructor = Script

Script.prototype.execute = function(scope){    
    var ret = {}
    if (scope){
       params = scope.parameters
    }

    var env = _.merge($$$, {
        craft: scope,
    })    
    var code = addWith('env', this.text + '; ret.val = main(params);')
    eval(code)    
    return ret.val
}

Script.prototype.renderSelf = function(scope) {
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