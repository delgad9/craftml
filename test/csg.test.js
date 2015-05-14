var chai = require('chai'),
    chaiSubset = require('chai-subset'),
    assert = require('chai').assert,
    inspect = require('eyes').inspector(),
    _ = require('lodash')


var CSG1 = require('../lib/scad/csg'),
CSG2 = require('craft-scad1').CSG


function test(f){
    var c1 = f(CSG1)
    var c2 = f(CSG2)
    c1.toString().length.should.be.eql(c2.toString().length)
    c1.toString().slice(0,100).should.be.eql(c2.toString().slice(0,100))
}

describe('#csg', function() {

    it('shapes', function() {

        test(function(CSG){
            return new CSG.cube()
        })

        test(function(CSG){
            console.log(CSG)
            return new CSG.sphere()
        })

        test(function(CSG){
            return new CSG.cylinder()
        })

        test(function(CSG){
            return new CSG.roundedCylinder()
        })

        test(function(CSG){
            return new CSG.roundedCube()
        })

    })

    it('transform', function() {

        test(function(CSG){
            return new CSG.cube().translate([1,1,1])
        })

        test(function(CSG){
            return new CSG.cube().scale([2,2,2])
        })

        test(function(CSG){
            return new CSG.cube().rotateX(45)
        })

        test(function(CSG){
            return new CSG.cube().rotateY(45)
        })

        test(function(CSG){
            return new CSG.cube().rotateZ(45)
        })

    })

    it('set operations', function() {

        test(function(CSG){
            return new CSG.cube().translate([1,1,1]).union(new CSG.cube())
        })

        test(function(CSG){
            return new CSG.cube().translate([0.5,0.5,0.5]).subtract(new CSG.cube())
        })

        test(function(CSG){
            return new CSG.cube().translate([0.5,0.5,0.5]).intersect(new CSG.cube())
        })

    })
})
