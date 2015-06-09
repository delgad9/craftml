var stl = require('../stl'),
    Solid = require('../solid'),
    _ = require('lodash'),
    Promise = require("bluebird")

// var request = require('request')

var request = Promise.promisifyAll(require("request"))

var fs = Promise.promisifyAll(require('fs'))

function _createSolidFromStlString(stlstring, src, element) {

    var csg = stl.parse(stlstring, 'craftml')
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

        solid.translateTo({x:0,y:0,z:0})

        var p = new Solid()
        p.tag = 'group'
        p.children = [solid]
        p.fitToChildren()
        p.scale({x:factor,y:factor,z:factor})

        return p

    }else{

        return solid
    }
}

function doCORSRequest(options, cb) {
    var cors_api_host = 'cors-anywhere.herokuapp.com';
    var cors_api_url = 'https://' + cors_api_host + '/';
    var x = new XMLHttpRequest();
    x.open(options.method, cors_api_url + options.url);
    x.overrideMimeType("text/plain; charset=x-user-defined")
    x.onload = x.onerror = function() {
        var blob = new Blob([x.response])
        if (x.response) {
            cb(null, x.response)
        } else {
            cb(x)
        }
    }
    if (/^POST/i.test(options.method)) {
        x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    }
    x.send(options.data);
}

module.exports = function(render, element, scope) {

    var contents = element.attribs['contents']

    return new Promise(function(resolve, reject){
        var solid = _createSolidFromStlString(contents, 'craftml', element)
        resolve(solid)
    })
    // console.log('importing %s', src)
}

function old(render, element, scope) {

    var src = element.attribs['src']

    console.log('importing %s', src)

    if (src.match(/^http/)) {
        // from a remote url


        if (!global.window){

            // in Node.js

            return request
                .getAsync(src)
                .then(function(results) {
                    // results = [response, body]

                    var stlstring = results[1]
                    return _createSolidFromStlString(stlstring, src, element)
                })

        } else {

            // in Browser

            // load an stl using CORS anywhere workaround
            return new Promise(function(resolve, reject) {

                    doCORSRequest({
                        method: 'get',
                        url: src
                    }, function(error, response) {
                        if (error)
                            reject(error)
                        else
                            resolve(response)
                    })

                })
                .then(function(stlstring) {
                    return _createSolidFromStlString(stlstring, src, element)
                })

        }

    } else {
        // from the local file system

        return fs
            .readFileAsync(src, 'binary')
            .then(function(stlstring) {
                return _createSolidFromStlString(stlstring, src, element)
            })

    }
}
