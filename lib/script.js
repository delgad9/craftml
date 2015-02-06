'strict'

module.exports = Script

var $$$ = require('craft-scad'),
    addWith = require('with'),
    Element = require('./element')
Solid = require('./solid'),
_ = require('lodash'),
parse = require('./parse')

function Script(type, text) {
    Element.apply(this)
    this.type = 'text/craftml'
    this.text = text
}

Script.prototype = new Element()
Script.prototype.constructor = Script

function executeAsOpenJscad(text, scope) {
    var ret = {}
    if (scope) {
        params = scope.parameters
    }

    var env = _.merge($$$, {
        craft: scope,
    })
    var code = addWith('env', text + '; ret.val = main(params);')
    eval(code)
    var csg = ret.val

    if (csg.polygons === undefined) {
        throw 'openjscad does not return a csg ' + csg
    }

    var solid = new Solid()
    solid.csg = csg
    solid.layout = computeLayout(csg)

    // console.log(scope.parameters)

    // solid.layout.x = scope

    return solid
}

function executeAsCraftml(text, scope) {
    var ret = {}
    if (scope) {
        params = scope.parameters
    }

    // prepare 'require'
    var req = module.require
    var require = function(moduleId) {
        try {
            var m = req(moduleId)
            return m
        } catch (err) {
            // load from cwd()
            return req('./' + moduleId)
        }
    }

    var env = _.merge({
        craft: scope,
    })
    var code = addWith('env', text + '; ret.val = main(params);')
    eval(code)

    var xml = ret.val
    // set position="absolute" to prevent children solids from
    // being laid out (a hack)
    xml = '<craft position="absolute">' + xml + '</craft>'

    var c = parse(xml)
    var solid = c.render(scope)
    return solid.children
}

Script.prototype.execute = function(scope) {
    if (this.type === 'text/craftml') {
        return executeAsCraftml(this.text, scope)

    } else if (this.type === 'text/openjscad') {
        return executeAsOpenJscad(this.text, scope)
    }
}

Script.prototype.renderSelf = function(scope) {
    var solid = this.execute(scope)
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