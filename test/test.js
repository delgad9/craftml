var craft = require('../lib/craft'),
    _ = require('lodash'),
    path = require('path')

var chai = require('chai'),
    expect = require('chai').expect

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    glob = require('glob'),
    mkdirp = require('mkdirp')

function buildStlAsync(path) {
    var src = path
    return fs.readFileAsync(src, 'utf8')
        .then(function(code) {
            var options = {
                basePath: path
            }
            return craft.build(code, options)
        })
        .then(function(r) {
            return r.toStlString()
        })
}

var headOf = function(x) {
    return x.slice(0, 100)
}

var mkdirp = require('mkdirp')
module.exports = function(src){
    // console.log(file)

    // return buildStlAsync(src)
    //     .then(function(stlstring){
    //         // console.log(ret)
    //         var stlfile = src + '.stl'
    //         var dest = './test/output/' + stlfile
    //         var oracle = './test/oracle/' + stlfile
    //
    //         mkdirp.sync(path.dirname(dest))
    //
    //         console.log('writing to ', dest)
    //         return fs.writeFileAsync(dest, stlstring)
    //         //     .then(_.partial(exportStlToImages, dest))
    //     })

    var stlfile = src + '.stl'
    var dest = './test/output/' + stlfile
    var oracle = './test/oracle/' + stlfile
    mkdirp.sync(path.dirname(dest))
    mkdirp.sync(path.dirname(oracle))

    return Promise.all([
            buildStlAsync(src),
            fs.readFileAsync(oracle, 'utf8')
                .catch(function(){
                    return 'new'
                })
        ])
        .spread(function(stl, expected) {

            // console.log('writing to ', dest)
            fs.writeFileAsync(dest, stl)

            // if oracle doesn't exist (new)
            if (expected == 'new'){
                // write it to the oracle folder pending manual verification
                oracle = oracle.replace('.stl', '.new.stl')
                fs.writeFileAsync(oracle, stl)

                // after manually verified, rename "foo.new.stl" to "foo.stl"
            }

            var n1 = stl.length
            var n2 = expected.length
            expect(n1).to.be.equal(n2)
            expect(headOf(stl)).to.be.equal(headOf(expected))
        })
}
