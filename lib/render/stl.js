var stl = require('../stl'),
    Solid = require('../solid'),
    _ = require('lodash'),
    Promise = require("bluebird")

// var request = require('request')

var request = Promise.promisifyAll(require("request"))

var fs = Promise.promisifyAll(require('fs'))

function _createSolidFromStlString(stlstring, src, element) {

    var csg = stl.parse(stlstring, src)
    var solid = new Solid(csg)

    // TODO: make this settable
    // normalize to fit a cubic volume of 'targetDim'
    var normalize = true
    if (normalize) {
        var targetDim = 20
        var bs = csg.getBounds()
        var xs = bs[1].x - bs[0].x
        var ys = bs[1].y - bs[0].y
        var zs = bs[1].z - bs[0].z
        var maxDim = _.max([xs, ys, zs])
        var factor = targetDim / maxDim

        solid.layout.scale = {
            x: factor,
            y: factor,
            z: factor
        }

        solid.layout.size = {
            x: xs * factor,
            y: ys * factor,
            z: zs * factor
        }

        solid.layout.location = {
            x: 0,
            y: 0,
            z: 0
        }
    }

    if (element.attribs.crop) {
        var crop = element.attribs.crop
        var p = crop.split(',')
        solid.crop = {
            x: [p[0], p[1]],
            y: [p[2], p[3]],
            z: [p[4], p[5]]
        }
    }

    return solid
}

module.exports = function(render, element, scope) {

    var src = element.attribs['src']

    console.log('importing %s', src)

    if (src.match(/^http/)) {
        // from a remote url
        return request
            .getAsync(src)
            .then(function(results) {
                // results = [response, body]
                var stlstring = results[1]
                return _createSolidFromStlString(stlstring, src, element)
            })

    } else {
        // from the local file system

        return fs
            .readFileAsync(src, 'binary')
            .then(function(stlstring) {
                return _createSolidFromStlString(stlstring, src, element)
            })

    }
}