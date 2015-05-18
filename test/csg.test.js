var chai = require('chai'),
    chaiSubset = require('chai-subset'),
    assert = require('chai').assert,
    inspect = require('eyes').inspector(),
    _ = require('lodash')


var CSG2 = require('../lib/scad/csg'),
CSG1 = require('craft-scad').CSG,
CSG = CSG2

var CAG2 = require('../lib/scad/cag'),
CAG1 = require('craft-scad').CAG


function test(f){
    var c1 = f(CSG1)
    var c2 = f(CSG2)
    c1.toString().length.should.be.eql(c2.toString().length)
    c1.toString().slice(0,100).should.be.eql(c2.toString().slice(0,100))
}

function testCAG(f){
    var c1 = f(CAG1)
    var c2 = f(CAG2)
    c1.toString().length.should.be.eql(c2.toString().length)
    c1.toString().slice(0,100).should.be.eql(c2.toString().slice(0,100))
}

var $$$ = require('../lib/scad')

describe('#openscad', function(){

    describe('rotate_extrude', function(){

        it('can handle sides touching the z-axis', function(){

            var s = $$$.square({size: [1,1], center: false}).translate([0,0,0])
            var csg = $$$.rotate_extrude({fn:4},s)

            csg.polygons.forEach(function(p){
                var isPlaneValid = !isNaN(p.plane.w)
                assert.isTrue(isPlaneValid, 'has a valid plane')
            })

        })


    })

})

// to test for regressions while refactoring csg + scad code

describe('#cag', function() {

    it('shapes', function() {

        testCAG(function(CAG){
            return new CAG.rectangle()
        })

        testCAG(function(CAG){
            return CAG.circle({center: [-2, -2], radius: 4, resolution: 20});
        })

        testCAG(function(CAG){
            return CAG.rectangle({center: [5, -2], radius: [2, 3]});
        })

        testCAG(function(CAG){
            return CAG.rectangle({corner1: [-10, 20], corner2: [15, -30]});
        })

        testCAG(function(CAG){
            return CAG.roundedRectangle({center: [5, 7], radius: [4, 4], roundradius: 1, resolution: 24});
        })

        testCAG(function(CAG){
            return CAG.roundedRectangle({corner1: [-2, 3], corner2: [4, -4], roundradius: 1, resolution: 24});
        })

    })

    it('operations', function(){

        testCAG(function(CAG){
            var s = CAG.circle({center: [-2, -2], radius: 4, resolution: 20});
            return s.extrude()
        })

    })
})

describe('#csg', function() {

    it('new', function(){

        new CSG.cube().toFloat32Array()

    })

    it('shapes', function() {

        test(function(CSG){
            return new CSG.cube()
        })

        test(function(CSG){
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

    it('lieFlat', function() {

        test(function(CSG){
            return new CSG.cube().translate([0,0,20]).lieFlat()
        })

    })

    it('geometry', function(){

        test(function(CSG){
            return new CSG.Path2D([[10,10], [-10,10]])
        })

        test(function(CSG) {
            return CSG.Path2D.arc({
                center: [0, 0, 0],
                radius: 10,
                startangle: 0,
                endangle: 180,
                resolution: 16,
            });
        })

        test(function(CSG) {
            return new CSG.Path2D([[10,10], [-10,10], [-10,-10], [10,-10]], /* closed = */ true);
        })

    })

    it('to', function() {
        test(function(CSG){
            return new CSG.cube().toCompactBinary()
        })

        test(function(CSG){
            return new CSG.cube().toStlBinary()
        })

        test(function(CSG){
            return new CSG.cube().toStlString()
        })

        test(function(CSG){
            return new CSG.cube().toAMFString()
        })

        test(function(CSG){
            return new CSG.cube().toPointCloud(1)
        })
    })

    it('from', function() {
        test(function(CSG){
            return CSG.fromCompactBinary(new CSG.cube().toCompactBinary())
        })

        test(function(CSG){
            return CSG.fromPolygons(new CSG.cube().polygons)
        })

        test(function(CSG){
            return CSG.fromObject(new CSG.cube())
        })

    })

    it('#Polygon', function(){

        test(function(CSG){
            var p = CSG.cube().toPolygons()[0]
            var v = p.plane.normal
            return p.extrude(v)
        })

    })

    it('ext', function() {
        this.timeout(5000);

        test(function(CSG){
            return new CSG.cube().expandedShell(5, 10, true)
        })

        test(function(CSG){
            return new CSG.cube().expandedShell(5, 10, false)
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
