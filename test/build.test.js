var craft = require('../lib/craft'),
    _ = require('lodash')

var chai = require('chai')
chai.should()

var Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    glob = require('glob')

function buildStlAsync(path) {
    var src = path + '/index.xml'
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

describe('build stl', function() {

    function test(){
        var dir = 'test/examples/' + this.test.title
        var headOf = function(x) {
            return x.slice(0, 100)
        }
        return Promise.all([
                buildStlAsync(dir),
                fs.readFileAsync(dir + '/output.stl', 'utf8')
            ])
            .spread(function(stl, expected) {
                stl.length.should.be.equal(expected.length)
                headOf(stl).should.be.equal(headOf(expected))
            })
    }

    it('fivepins', test)
    it('pin', test)
    it('pin-grid', test)
    it('shapes', test)
    it('scaling', test)
    it('positioning', test)
})
