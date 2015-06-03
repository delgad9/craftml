var chai = require('chai'),
    // fs = require('fs'),
    inspect = require('eyes').inspector()

chai.should()

var Solid = require('../lib/solid'),
    Location = require('../lib/location'),
    Size = require('../lib/size'),
    $$$ = require('../lib/scad')

describe('#Solid', function() {

    var cube = $$$.cube([10,10,10])

    it('construct default', function() {

        var s = new Solid()
        // inspect(s)
    })

    describe('transform', function(){

        var s

        beforeEach(function(){
            s = new Solid(cube)
        })

        it('translate and apply', function(){

            s.translate(10,10,10)
            s.translate(10,10,10)

            s.apply()

            var b = s.debug().getPolygonsBoundingBox()
            b.location.should.be.eql(new Location(20,20,20))
            b.size.should.be.eql(new Size(10,10,10))

        })

        it('translate', function(){

            s.translate(10,10,10)
            s.getLocation().should.be.eql(new Location(10,10,10))

            s.translate(5,-5,0)
            s.getLocation().should.be.eql(new Location(15,5,10))

        })

        it('translateTo', function(){

            s.translateTo(20,20,20)
            s.getLocation().should.be.eql(new Location(20,20,20))

            s.translateTo(10,10,10)
            s.getLocation().should.be.eql(new Location(10,10,10))

        })


        it('translateTo and apply', function(){

            s.translateTo(20,20,20)
            s.translateTo(10,10,10)

            s.apply()

            var b = s.debug().getPolygonsBoundingBox()
            b.location.should.be.eql(new Location(10,10,10))
            b.size.should.be.eql(new Size(10,10,10))
        })

        it('centerAt', function(){

            s.centerAt(20,20,20)
            s.getLocation().should.be.eql(new Location(15,15,15))

        })

        it('centerAt and apply', function(){

            s.centerAt(20,20,20)
            s.getLocation().should.be.eql(new Location(15,15,15))

            s.apply()

            var b = s.debug().getPolygonsBoundingBox()
            b.location.should.be.eql(new Location(15,15,15))
            b.size.should.be.eql(new Size(10,10,10))

        })

        it('scale', function(){
            s.scale(2,1,1)
            s.getLocation().should.be.eql(new Location(0,0,0))
            s.getSize().should.be.eql(new Size(20,10,10))
        })

        it('scale and apply', function(){
            s.scale(2,1,1)
            s.scale(1,1,2)
            s.scale(1,3,1)

            s.apply()

            var b = s.debug().getPolygonsBoundingBox()
            b.location.should.be.eql(new Location(0,0,0))
            b.size.should.be.eql(new Size(20,30,20))
        })


    })
})
