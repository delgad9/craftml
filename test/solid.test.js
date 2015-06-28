var chai = require('chai'),
    // fs = require('fs'),
    inspect = require('eyes').inspector(),
    expect = require('chai').expect

chai.should()

var Solid = require('../lib/solid'),
    Location = require('../lib/location'),
    Size = require('../lib/size'),
    $$$ = require('../lib/scad')

describe('#Solid', function() {

    var cube = $$$.cube([10,10,10])
    var brick = $$$.cube([10,20,30])

    it('construct default', function() {

        var s = new Solid()
        // inspect(s)
    })

    describe('transform', function(){

        var s

        beforeEach(function(){
            s = new Solid(cube)
        })

        it('getBounds', function(){

            s.getBounds().location.should.be.eql(new Location(0,0,0))
            s.getBounds().size.should.be.eql(new Size(10,10,10))

        })

        it('translate and apply', function(){

            s.translate(10,10,10)
            s.translate(10,10,10)

            s.apply()

            var b = s.debug().getPolygonsBounds()
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

            var b = s.debug().getPolygonsBounds()
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

            var b = s.debug().getPolygonsBounds()
            b.location.should.be.eql(new Location(15,15,15))
            b.size.should.be.eql(new Size(10,10,10))

        })

        it('scale (2,1,1)', function(){
            s.scale(2,1,1)
            s.getLocation().should.be.eql(new Location(0,0,0))
            s.getSize().should.be.eql(new Size(20,10,10))
        })

        it('scale (2)', function(){
            s.scale(2)
            s.getLocation().should.be.eql(new Location(0,0,0))
            s.getSize().should.be.eql(new Size(20,20,20))
        })

        it('scale and apply', function(){
            s.scale(2,1,1)
            s.scale(1,1,2)
            s.scale(1,3,1)

            s.apply()

            var b = s.debug().getPolygonsBounds()
            b.location.should.be.eql(new Location(0,0,0))
            b.size.should.be.eql(new Size(20,30,20))
        })

        it('scaleTo (20,20,30)', function(){
            s.scaleTo(20,20,30)
            s.getLocation().should.be.eql(new Location(0,0,0))
            s.getSize().should.be.eql(new Size(20,20,30))
        })

        it('scaleTo (20)', function(){
            s.scaleTo(20)
            s.getLocation().should.be.eql(new Location(0,0,0))
            s.getSize().should.be.eql(new Size(20,20,20))
        })

        it('translate, scale, apply', function(){
            s.translate(-10,0,0)
            s.scale(2,1,1)

            s.apply()

            var b = s.debug().getPolygonsBounds()
            b.location.should.be.eql(new Location(-10,0,0))
            b.size.should.be.eql(new Size(20,10,10))
        })

        it('rotateX(90)', function(){
            s.rotateX(90)
            s.getLocation().should.be.eql(new Location(0,0,0))
            s.getSize().should.be.eql(new Size(10,10,10))
        })

        it('rotateZ(45)', function(){
            s.rotateZ(45)

            var loc = s.getLocation()
            loc.should.have.property('x').to.be.closeTo(-2.07,0.01)
            loc.should.have.property('y').to.be.closeTo(-2.07,0.01)
            loc.should.have.property('z').to.be.eql(0)

            var size = s.getSize()
            size.should.have.property('x').to.be.closeTo(14.14,0.01)
            size.should.have.property('y').to.be.closeTo(14.14,0.01)
            size.should.have.property('z').to.be.eql(10)
        })

        it('rotateZ(45) rotateY(90)', function(){
            s.rotateZ(45)
            s.rotateY(90)

            var loc = s.getLocation()
            loc.should.have.property('x').to.be.closeTo(0,0.01)
            loc.should.have.property('y').to.be.closeTo(-2.07,0.01)
            loc.should.have.property('z').to.be.closeTo(-2.07,0.01)

            var size = s.getSize()
            size.should.have.property('x').to.be.eql(10)
            size.should.have.property('y').to.be.closeTo(14.14,0.01)
            size.should.have.property('z').to.be.closeTo(14.14,0.01)
        })

        it('rotateZ(90) w.r.t. [0,0,0]', function(){
            s.rotateZ(90, [0,0,0])

            var b = s.getBounds()
            b.location.should.be.eql(new Location(-10,0,0))
            b.size.should.be.eql(new Size(10,10,10))
        })

    })

    describe('box', function(){

        var Box = require('../lib/box'),
            Location = require('../lib/location'),
            Size = require('../lib/size'),
            Matrix4x4 = require('../lib/scad/geometry/Matrix4x4')


        it('can create', function(){
            var box = new Box()
        })

        it('can create with location and size', function(){
            var box = new Box(new Location(10,20,30), new Size(1,2,3))
            box.location.should.be.eql(new Location(10,20,30))
            box.size.should.be.eql(new Size(1,2,3))
        })

        it('can transform', function(){
            var box = new Box(new Location(0,0,0), new Size(10,10,10))
            box.transform(Matrix4x4.translation([10,20,30]))
            box.location.should.be.eql(new Location(10,20,30))
            box.size.should.be.eql(new Size(10,10,10))

            box.transform(Matrix4x4.scaling([2,3,4]))
            box.location.should.be.eql(new Location(20,60,120))
            box.size.should.be.eql(new Size(20,30,40))
        })

        it('can clone', function(){
            var box = new Box(new Location(0,0,0), new Size(10,10,10))
            var copy = box.clone()

            copy.transform(Matrix4x4.translation([10,20,30]))

            // the copy is transformed
            copy.location.should.be.eql(new Location(10,20,30))
            copy.size.should.be.eql(new Size(10,10,10))

            // but the original box should remain the same
            box.location.should.be.eql(new Location(0,0,0))
            box.size.should.be.eql(new Size(10,10,10))

        })

    })

    describe('parent/children', function(){

        var p, c, q, d

        beforeEach(function(){
            p = new Solid()
            q = new Solid()
            c = new Solid(cube)
            d = new Solid(brick)
        })

        it('can add children', function(){

            p.setChildren([c])

            var b = p.getBounds()
            b.location.should.be.eql(new Location(0,0,0))
            b.size.should.be.eql(new Size(10,10,10))

        })

        it('translating a solid does not immediately update the (local) location of its children', function(){

            p.setChildren([c])
            p.translate(10,10,10)

            var b = c.getBounds()
            b.location.should.be.eql(new Location(0,0,0))

        })

        it('translating a solid changes the location of its children after apply()', function(){

            p.setChildren([c])
            p.translate(10,10,10)

            p.apply()

            var b = c.getBounds()
            b.location.should.be.eql(new Location(10,10,10))
        })


        it('scaling a parent also scales its children', function(){

            p.setChildren([c])
            p.scale(4)

            p.apply()

            var b = c.debug().getPolygonsBounds()
            b.location.should.be.eql(new Location(0,0,0))
            b.size.should.be.eql(new Size(40,40,40))
        })

        it('scaling a solid scales its descendents', function(){

            p.setChildren([c])
            p.scale(4)

            q.setChildren([p])
            q.scale(0.5)
            q.translate(1,2,3)

            q.apply()

            var b = c.debug().getPolygonsBounds()
            b.location.should.be.eql(new Location(1,2,3))
            b.size.should.be.eql(new Size(20,20,20))
        })

        it('rotating a solid rotates its child', function(){

            p.setChildren([c, d])
            p.rotateZ(90)

            p.apply()

            var b = d.debug().getPolygonsBounds()
            b.size.should.be.eql(new Size(20,10,30))
        })

    })



    describe('transformEval', function(){

        var s, r

        beforeEach(function(){
            s = new Solid(cube)
            r = new Solid(cube)
        })

        it('translate(10,0,0)', function(){

            s.transformEval('translate(10,0,0)')

            r.translate(10,0,0)

            var b1 = s.getBounds()
            var b2 = r.getBounds()
            b1.location.should.be.eql(b2.location)
            b1.size.should.be.eql(b2.size)
        })

        it('translate scale rotateX', function(){

            s.transformEval('translate(10,0,0) scale(3) rotateX(45)')

            r.translate(10,0,0)
            r.scale(3)
            r.rotateX(45)

            var b1 = s.getBounds()
            var b2 = r.getBounds()
            b1.location.should.be.eql(b2.location)
            b1.size.should.be.eql(b2.size)
        })

        it('translate(a,b,c) where a=1 b=2 c=3', function(){

            s.transformEval('translate(a,b,c)', {a:1,b:2,c:3})

            r.translate(1,2,3)

            var b1 = s.getBounds()
            var b2 = r.getBounds()
            b1.location.should.be.eql(b2.location)
            b1.size.should.be.eql(b2.size)
        })

        it('rotateX rotateY rotateZ', function(){

            s.transformEval('rotateX(45) rotateY(60) rotateZ(30)')

            r.rotateX(45)
            r.rotateY(60)
            r.rotateZ(30)

            var b1 = s.getBounds()
            var b2 = r.getBounds()
            b1.location.should.be.eql(b2.location)
            b1.size.should.be.eql(b2.size)
        })

        it('spaces in expression e.g., translate( 1 , 2 , 3) scale( 3 ) ', function(){

            s.transformEval('translate( 1 , 2 , 3) scale( 3 ); ')

            r.translate(1,2,3)
            r.scale(3)

            var b1 = s.getBounds()
            var b2 = r.getBounds()
            b1.location.should.be.eql(b2.location)
            b1.size.should.be.eql(b2.size)
        })

        it('calculations in expression e.g., scale(s/2) s = 3 ', function(){

            s.transformEval('scale(s/2) translate(s*2, s+5, s+6)', {s:4})

            var k = 4
            r.scale(k/2)
            r.translate(k*2, k+5, k+6)

            var b1 = s.getBounds()
            var b2 = r.getBounds()
            b1.location.should.be.eql(b2.location)
            b1.size.should.be.eql(b2.size)
        })

    })

    describe('coordinate conversions', function(){

            var a, b, c, d, e
            beforeEach(function(){
                a = new Solid()
                b = new Solid()
                c = new Solid(cube)
                d = new Solid(cube)
                e = new Solid(cube)
            })

            function logx(n, o){
                console.log(n, ': x=', o.getBounds().location.x, 'sx=', o.getBounds().size.x)
            }

            function log(){
                console.log('--')
                logx('a',a)
                logx('b',b)
                logx('c',c)
            }

            function _a(x,sx){
                expect(a.getBounds().location.x).to.be.eql(x)
                expect(a.getBounds().size.x).to.be.eql(sx)
            }
            function _b(x,sx){
                expect(b.getBounds().location.x).to.be.eql(x)
                expect(b.getBounds().size.x).to.be.eql(sx)
            }
            function _c(x,sx){
                expect(c.getBounds().location.x).to.be.eql(x)
                expect(c.getBounds().size.x).to.be.eql(sx)
            }

            it('convert to another coordinate system and convert back', function(){

                b.setChildren([c])
                b.scale(2)
                b.translate(10,0,0)
                a.setChildren([d,b])

                // DCC  a: x=0   sx=30
                // _CC  b: x=10  sx=20  => [a]
                // _C   c: x=0   sx=10  => [b]
                // log()

                c.convertCoordinateTo(a)
                // DCC  a: x=0   sx=30
                // _CC  b: x=10  sx=20  => [a]
                // _C   c: x=10  sx=20  => [a]
                // log()
                _a(0,30)
                _b(10,20)
                _c(10,20)

                c.convertCoordinateTo(b)
                // DCC  a: x=0   sx=30
                // _CC  b: x=10  sx=20  => [a]
                // _C   c: x=0   sx=10  => [b]
                // log()
                _a(0,30)
                _b(10,20)
                _c(0,10)

                c.convertCoordinateTo(c)    // should have no effect
                // DCC  a: x=0   sx=30
                // _CC  b: x=10  sx=20  => [a]
                // _C   c: x=0   sx=10  => [b]
                // log()
                _a(0,30)
                _b(10,20)
                _c(0,10)

                c.convertCoordinateTo(a)
                // DCC  a: x=0   sx=30
                // _CC  b: x=10  sx=20  => [a]
                // _C   c: x=10  sx=20  => [a]
                // log()
                _a(0,30)
                _b(10,20)
                _c(10,20)
            })

            it('translate w.r.t. another coordinate system', function(){

                c.translate(10,0,0)
                b.setChildren([e, c])
                b.scale(2)
                b.translate(10,0,0)
                a.setChildren([d, b])

                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=10  sx=10  => [b]
                // log()
                _a(0,50)
                _b(10,40)
                _c(10,10)

                c.convertCoordinateTo(a)
                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=30  sx=20  => [a]
                // log()
                _a(0,50)
                _b(10,40)
                _c(30,20)

                c.translate(20,0,0)
                // DEE__CC  a: x=0   sx=70
                //  EE__CC  b: x=10  sx=60  => [a]
                //  E_C     c: x=50  sx=20  => [a]
                // log()
                _a(0,70)
                _b(10,60)
                _c(50,20)

                // DEE__CC  a: x=0   sx=70
                //  EE__CC  b: x=10  sx=60  => [a]
                //  E_C     c: x=20  sx=10  => [b]
                c.convertCoordinateTo(b)
                // log()
                _a(0,70)
                _b(10,60)
                _c(20,10)

            })

            it('translateTo w.r.t. another coordinate system', function(){

                c.translate(10,0,0)
                b.setChildren([e, c])
                b.scale(2)
                b.translate(10,0,0)
                a.setChildren([d, b])

                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=10  sx=10  => [b]
                // log()
                _a(0,50)
                _b(10,40)
                _c(10,10)

                c.convertCoordinateTo(a)
                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=30  sx=20  => [a]
                // log()
                _a(0,50)
                _b(10,40)
                _c(30,20)

                c.translateTo(50,0,0)
                // DEE__CC  a: x=0   sx=70
                //  EE__CC  b: x=10  sx=60  => [a]
                //  E_C     c: x=50  sx=20  => [a]
                _a(0,70)
                _b(10,60)
                _c(50,20)

                // DEE__CC  a: x=0   sx=70
                //  EE__CC  b: x=10  sx=60  => [a]
                //  E_C     c: x=20  sx=10  => [b]
                c.convertCoordinateTo(b)
                // log()
                _a(0,70)
                _b(10,60)
                _c(20,10)

            })

            it('scale w.r.t. another coordinate system', function(){

                c.translate(10,0,0)
                b.setChildren([e, c])
                b.scale(2)
                b.translate(10,0,0)
                a.setChildren([d, b])

                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=10  sx=10  => [b]
                // log()
                _a(0,50)
                _b(10,40)
                _c(10,10)

                c.convertCoordinateTo(a)
                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=30  sx=20  => [a]
                // log()
                _a(0,50)
                _b(10,40)
                _c(30,20)

                c.scale(2,1,1)
                // DEECCCC  a: x=0   sx=70
                //  EECCCC  b: x=10  sx=60  => [a]
                //  ECC     c: x=30  sx=40  => [a]
                // log()
                _a(0,70)
                _b(10,60)
                _c(30,40)

                c.convertCoordinateTo(b)
                // DEECCCC  a: x=0   sx=70
                //  EECCCC  b: x=10  sx=60  => [a]
                //  ECC     c: x=10  sx=20  => [c]
                // log()
                _a(0,70)
                _b(10,60)
                _c(10,20)

            })

            it('rotate w.r.t. another coordinate system', function(){

                c.translate(10,0,0)
                b.setChildren([e, c])
                b.scale(2)
                b.translate(10,0,0)
                a.setChildren([d, b])

                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=10  sx=10  => [b]
                // log()
                _a(0,50)
                _b(10,40)
                _c(10,10)

                c.convertCoordinateTo(a)
                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=30  sx=20  => [a]
                // log()
                _a(0,50)
                _b(10,40)
                _c(30,20)

                c.scale(3,1,1)
                // DEECCCCCC  a: x=0   sx=90
                //  EECCCCCC  b: x=10  sx=80  => [a]
                //  ECCC      c: x=30  sx=60  => [a]
                // log()
                _a(0,90)
                _b(10,80)
                _c(30,60)

                c.rotateZ(90)
                // DEE__CC  a: x=0   sx=70
                //  EE__CC  b: x=10  sx=60  => [a]
                //  E_C     c: x=50  sx=20  => [a]

                // log()
                _a(0,70)
                _b(10,60)
                _c(50,20)

            })

            it('scale and translate w.r.t. another coordinate system', function(){

                c.translate(10,0,0)
                b.setChildren([e, c])
                b.scale(2)
                b.translate(10,0,0)
                a.setChildren([d, b])

                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=10  sx=10  => [b]
                // log()
                _a(0,50)
                _b(10,40)
                _c(10,10)

                c.convertCoordinateTo(a)
                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=30  sx=20  => [a]
                // log()
                _a(0,50)
                _b(10,40)
                _c(30,20)

                c.scale(2,1,1)
                // DEECCCC  a: x=0   sx=70
                //  EECCCC  b: x=10  sx=60  => [a]
                //  ECC     c: x=30  sx=40  => [a]
                // log()
                _a(0,70)
                _b(10,60)
                _c(30,40)

                c.translate(20,0,0)
                // DEE__CCCC  a: x=0   sx=90
                //  EE__CCCC  b: x=10  sx=80  => [a]
                //  E_CC      c: x=50  sx=40  => [a]
                // log()
                _a(0,90)
                _b(10,80)
                _c(50,40)

                c.convertCoordinateTo(b)
                // DEE__CCCC  a: x=0   sx=90
                //  EE__CCCC  b: x=10  sx=80  => [a]
                //  E_CC      c: x=20  sx=20  => [b]
                // log()
                _a(0,90)
                _b(10,80)
                _c(20,20)

            })

            it('transform w.r.t. another coordinate system and apply', function(){

                c.translate(10,0,0)
                b.setChildren([e, c])
                b.scale(2)
                b.translate(10,0,0)
                a.setChildren([d, b])

                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=10  sx=10  => [b]
                // log()

                c.convertCoordinateTo(a)
                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=30  sx=20  => [a]
                // log()

                c.scale(2,1,1)
                // DEECCCC  a: x=0   sx=70
                //  EECCCC  b: x=10  sx=60  => [a]
                //  ECC     c: x=30  sx=40  => [a]
                // log()

                c.translate(20,0,0)
                // DEE__CCCC  a: x=0   sx=90
                //  EE__CCCC  b: x=10  sx=80  => [a]
                //  E_CC      c: x=50  sx=40  => [a]
                // log()

                a.apply()

                var p = c.debug().getPolygonsBounds()
                p.location.should.be.eql(new Location(50,0,0))
                p.size.should.be.eql(new Size(40,20,20))
            })

            it('translate w.r.t. a selected descendent', function(){


                c.translate(10,0,0)
                b.setChildren([e, c])
                b.scale(2)
                b.translate(10,0,0)
                a.setChildren([d, b])

                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=10  sx=10  => [b]
                // log()

                c.convertCoordinateTo(a)
                // DEECC  a: x=0   sx=50
                //  EECC  b: x=10  sx=40  => [a]
                //  EC    c: x=30  sx=20  => [a]
                // log()

                b.transformAt(c).translate(20,0,0)
                // D__EECC  a: x=0   sx=70
                //    EECC  b: x=30  sx=40  => [a]
                //    EC    c: x=50  sx=20  => [a]
                // log()
                _a(0,70)
                _b(30,40)
                _c(50,20)

                a.apply()
                // log()
                _a(0,70)
                _b(30,40)
                _c(50,20)

            })

    })
})
