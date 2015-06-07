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

    describe('parent/children', function(){

        var p, c, q

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

        describe('coordinate conversions', function(){

                var a, b, c, d, e, b1, b2, c1, c2
                //    a
                //   / \
                //  b1 b2
                //    / \
                //   c1 c2

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
                    a.getBounds().location.x.should.be.eql(x)
                    a.getBounds().size.x.should.be.eql(sx)
                }
                function _b(x,sx){
                    b.getBounds().location.x.should.be.eql(x)
                    b.getBounds().size.x.should.be.eql(sx)
                }
                function _c(x,sx){
                    c.getBounds().location.x.should.be.eql(x)
                    c.getBounds().size.x.should.be.eql(sx)
                }

                it('can convert and convert back', function(){

                    b.setChildren([c])
                    b.scale(2)
                    b.translate(10,0,0)
                    a.setChildren([d,b])

                    // DCC  a: x=0   sx=30
                    // _CC  b: x=10  sx=20  => [a]
                    // _C   c: x=0   sx=10  => [b]
                    // log()
                    c.getBounds().location.x.should.be.eql(0)
                    c.getBounds().size.x.should.be.eql(10)

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

                it('can translate w.r.t. another coordinate system', function(){

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

                it('can scale w.r.t. another coordinate system', function(){

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

                it('can scale and translate w.r.t. another coordinate system', function(){

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
                    log()
                    _a(0,90)
                    _b(10,80)
                    _c(50,40)

                    c.convertCoordinateTo(b)
                    // DEE__CCCC  a: x=0   sx=90
                    //  EE__CCCC  b: x=10  sx=80  => [a]
                    //  E_CC      c: x=20  sx=20  => [b]
                    log()
                    _a(0,90)
                    _b(10,80)
                    _c(20,20)
                    
                })


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
})
