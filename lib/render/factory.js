var Promise = require("bluebird")

var addWith = require('with'),
    _ = require('lodash'),
    $$$ = require('craft-scad'),
    Solid = require('../solid')


function evalOpenJscadScript(params, code) {

    var ret = {}

    var env = _.merge($$$, {})

    var code = addWith('env', code + '; ret.val = main(params);')
    eval(code)
    var csg = ret.val

    if (csg.polygons === undefined) {
        throw 'openjscad does not return a csg ' + csg
    }

    var solid = new Solid(csg)
    // solid.csg = csg
    // solid.layout = computeLayout(csg)
    return solid
}

module.exports = function(render, element, scope) {
    var parameters = scope.parameters

    // console.log(element)
    var solid
    if (element.code) {

        solid = evalOpenJscadScript(parameters, element.code)

    } else {

        solid = element.create(parameters)
    }

    return new Promise(function(resolve, reject) {
        // console.log('*factory')
        // var solid = element.create(parameters)
        //     // console.log('*factory:create')
        if (solid) {
            resolve(solid)
        } else {
            reject()
        }
    })
}