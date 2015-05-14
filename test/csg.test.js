var chai = require('chai'),
    chaiSubset = require('chai-subset'),
    assert = require('chai').assert,
    inspect = require('eyes').inspector(),
    _ = require('lodash')


var CSG1 = require('../lib/scad/csg'),
CSG2 = require('craft-scad1').CSG

describe('#csg', function() {

    it('shapes', function() {

        var c1 = new CSG1.cube().translate([1,1,1])
        var c2 = new CSG2.cube().translate([1,1,1])
        // inspect(c1)
        // inspect(c2)
        // console.log(c1.toString())
        // console.log(c2.toString())
        c1.toString().should.be.eql(c2.toString())

    })
})
