var craft = require('../../lib/craft'),
    _ = require('lodash'),
    path = require('path')

var chai = require('chai'),
    expect = chai.expect

require('./assert')

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    glob = require('glob'),
    mkdirp = require('mkdirp')

function buildAsync(src) {
    return fs.readFileAsync(src, 'utf8')
        .then(function(code) {
            var options = {
                basePath: path.dirname(src)
            }
        //    return Promise.join(craft.build(code, options), craft.preview1(code, options))
            return Promise.join(craft.preview1(code, options))
        })
}

function headOf(x) {
    return x.slice(0, 100)
}

function isEquivalent(actual, expected){
    var sameLength = actual.length == expected.length
    var sameHead = headOf(actual) == headOf(expected)

    // console.log(stl, expected)
    return sameLength && sameHead
}

function check(actual, expected, dest){

    // if expected value is available
    if (expected){

        if (!isEquivalent(actual, expected)){
            var destDiff = dest.replace(/\.([^(/\.)]+)$/, '.diff.$1')
            mkdirp.sync(path.dirname(destDiff))
            fs.writeFileAsync(destDiff, actual)

            expect(false).to.be.equal('not the same')
        }

    } else {

        var destNew = dest.replace(/\.([^(/\.)]+)$/, '.new.$1')
        // dest === primitives/cube-large.xml.new.stl
        // dest === primitives/cube-large.xml.new.d3d
        // ... etc

        // add '.new' right before the extension so it can be
        // manually inspected

        mkdirp.sync(path.dirname(destNew))
        fs.writeFileAsync(destNew, actual)
        console.log('[new] ', destNew)
    }
}

var mkdirp = require('mkdirp')
module.exports = function(src){

    // src === 'test/examples/primitives/cube'

    var name = src.match(/examples\/(.*)/)[1]
    // name == 'primitives/cube.xml'

    var expectedFixtures = {
        stl: './test/output/' + name + '.stl',
        d3d: './test/output/' + name + '.d3d'
    }


    function doChecks(ret, stlE, d3dE) {

        // built stl
        var stlA = ret[0].toStlString()

        // previewable d3d
        var d3dA = ret[1].save()

        check(stlA, stlE, expectedFixtures.stl)
        check(d3dA, d3dE, expectedFixtures.d3d)
    }


    return Promise.all([buildAsync(src),
            fs.readFileAsync(expectedFixtures.stl, 'utf8').catch(function(){return null}),
            fs.readFileAsync(expectedFixtures.d3d, 'utf8').catch(function(){return null})
        ])

        .spread(function(){})


}
