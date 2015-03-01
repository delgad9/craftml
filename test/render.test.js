var chai = require('chai'),
    assert = require('chai').assert,
    sinon = require("sinon"),
    sinonChai = require("sinon-chai")

chai.should()
chai.use(sinonChai);

var render = require('../lib/render'),
    Solid = require('../lib/solid'),
    Scope = require('../lib/scope'),
    chaiSubset = require('chai-subset'),
    inspect = require('eyes').inspector(),
    EventEmitter = require("events").EventEmitter

var _ = require('lodash')


var mock = require('./mock')
var script = mock.script,
    a = mock.a,
    unit = mock.unit,
    craft = mock.craft,
    parameter = mock.parameter,
    group = mock.group,
    solid = mock.solid,
    solidGroup = mock.solidGroup,
    content = mock.content,
    crop = mock.crop,
    foo = mock.foo,
    stl = mock.stl,
    scale = mock.scale,
    jscad = mock.jscad

function match(actual, expected) {

    if (_.isArray(expected) && _.isArray(actual)) {

        actual.should.have.length(expected.length)

        for (var i = 0; i < actual.length; i++) {

            actual[i].type.should.be.equal(expected[i].type)

        }

    } else {

        actual.type.should.be.equal(expected.type)

        if (actual.children)
            match(actual.children, expected.children)

    }
}

describe('render()', function() {

    it('can render a single unit', function() {

        var c = unit()

        render(c)
            .then(function(r) {
                match(r, solid())
            })
    })

    it('can render an array of two units', function() {

        var c = [unit(), unit()]

        render(c)
            .then(function(r) {
                // inspect(r)
                match(r, [solid(), solid()])
            })
    })

    it('can render a group of two units', function() {

        var c = group(unit(), unit())
            // inspect(c)

        render(c)
            .then(function(r) {
                // inspect(r)
                match(r,
                    solidGroup(solid(),
                        solid()))
            })

    })

    it('can render a group of two units within another group', function() {

        var c = group(unit(), group(unit(), unit()))
            // inspect(c)

        render(c)
            .then(function(r) {
                // inspect(r)    
                match(r,
                    solidGroup(solid(),
                        solidGroup(solid(),
                            solid())))
            })

    })

    it('does not render <craft> to anything', function() {

        var c = craft(unit())
            // inspect(c)

        render(c)
            .then(function(r) {
                assert.isNull(r)
            })

    })

    it('can resolve <foo> to <craft name="foo"><unit>', function() {

        var c = [
            craft(a('name', 'foo'),
                unit()),
            foo()
        ]

        // inspect(c)

        render(c)
            .then(function(r) {
                // inspect(r)    
                match(r, [solid()])
            })

    })

    it('can resolve <foo> three times', function() {

        var c = [
            craft(a('name', 'foo'),
                unit()),
            foo(),
            foo(),
            foo()
        ]

        // inspect(c)

        render(c)
            .then(function(r) {
                // inspect(r)
                match(r, [solid(), solid(), solid()])
            })

    })

    it('can resolve <content>', function() {
        var u = unit()
        var spy = sinon.spy(u, 'create')

        var c = [
                craft(a('name', 'foo'),
                    content()),
                foo(u, u)
            ]
            // inspect(c)

        render(c)
            .then(function(r) {
                //inspect(r)
                spy.should.have.been.calledTwice
            })

    })

    it('can resolve <content> multiple times', function() {
        var u = unit()
        var spy = sinon.spy(u, 'create')

        var c = [
                craft(a('name', 'foo'),
                    content(), content()),
                foo(u)
            ]
            // inspect(c)

        render(c)
            .then(function(r) {
                // inspect(r)
                spy.should.have.been.calledTwice
            })

    })

    it('can resolve x,y,z attributes as numbers', function() {

        var c = [
                craft(a('name', 'foo'), unit()),
                foo(a('x', '10'), a('y', '15'), a('z', '20'))
            ]
            // inspect(c)
        render(c)
            .then(function(r) {
                // inspect(r)
                r[0].layout.should.containSubset({
                    location: {
                        x: 10,
                        y: 15,
                        z: 20
                    }
                })
            })
    })

    it('can resolve x,y,z attributes as {{p1}}', function() {

        var c = [
                parameter(a('name', 'p1'), a('default', 10), a('type', 'int')),
                parameter(a('name', 'p2'), a('default', '15'), a('type', 'int')),
                craft(a('name', 'foo'), unit()),
                foo(a('x', '{{p1}}'), a('y', '{{p2}}'))
            ]
            // inspect(c)
        var r = render(c)
            .then(function(r) {
                // inspect(r)
                r[0].layout.should.containSubset({
                    location: {
                        x: 10,
                        y: 15
                    }
                })
            })

    })

    describe('layout', function() {

        it('can compute group size', function() {

            var c = group(unit(), unit())

            // inspect(c)
            render(c)
                .then(function(r) {

                    // inspect(r)

                    r.should.has.property('layout')
                    r.layout.should.containSubset({
                        size: {
                            x: 1,
                            y: 1,
                            z: 1
                        }
                    })

                })
        })

        it('can scale individual dimensions', function() {


            var c = scale(a('x', 3), a('y', 5), a('z', 4), unit())
                // inspect(c)

            render(c)
                .then(function(r) {

                    // inspect(r)
                    r.layout.should.containSubset({
                        size: {
                            x: 3,
                            y: 5,
                            z: 4
                        },
                        scale: {
                            x: 3,
                            y: 5,
                            z: 4
                        }
                    })

                })

        })

        it('can scale multiple times', function() {


            var c = scale(a('x', 2),
                scale(a('x', 3),
                    unit()))

            // inspect(c)

            render(c)
                .then(function(r) {

                    // inspect(r)
                    r.layout.should.containSubset({
                        size: {
                            x: 6
                        },
                        scale: {
                            x: 2,
                            y: 1,
                            z: 1
                        }
                    })

                })

        })



    })

    describe('stl', function() {

        it('can load pin.stl (282 polygons)', function() {
            var path = require('path')
            var src = path.resolve(__dirname, 'fixtures/pin.stl')
            var c = stl(a('src', src))
                // inspect(c)
            render(c)
                .then(function(r) {
                    // inspect(r)
                    match(r, solid())
                    r.should.has.property('layout')
                    r.csg.polygons.length.should.be.equal(282)
                })


        })

        it('can load pin.stl from a remote url', function(done) {

            var c = stl(a('src', 'https://raw.githubusercontent.com/sikuli/craftml/master/test/fixtures/pin.stl'))
                // inspect(c)

            render(c)
                .then(function(r) {
                    // inspect(r)
                    match(r, solid())
                    r.should.has.property('layout')
                    r.csg.polygons.length.should.be.equal(282)
                    done()
                })
        })


        it('can load giraffe.stl (binary, 11948 polygons)', function() {
            var path = require('path')
            var src = path.resolve(__dirname, 'fixtures/giraffe.stl')
            var c = stl(a('src', src))
                // inspect(c)

            render(c)
                .then(function(r) {
                    // inspect(r)
                    match(r, solid())
                    r.should.has.property('layout')
                    r.csg.polygons.length.should.be.equal(11948)
                })

        })

    })

    describe('script', function() {

        it('can run main()', function() {
            var c = script('function main(){ return 1; }')
                // inspect(c)

            render(c)
                .then(function(r) {
                    // inspect(r)
                    r.should.be.equal(1)
                })
        })

        it('can run two scripts in an array', function() {

            var c = [script('function main(){ return 1}'), script('function main(){ return 2}')]
                // inspect(c)

            render(c)
                .then(function(r) {
                    // inspect(r)
                    r.should.be.eql([1, 2])
                })
        })

        it('can be injected with parameters', function() {
            var spy = sinon.spy()
            var c = [
                    parameter(a('name', 'p1'), a('default', 2), a('type', 'int')),
                    script('function main(params){ return params}')
                ]
                // inspect(c)
            render(c)
                .then(function(r) {
                    // inspect(r)
                    r[0].p1.should.be.equal(2)
                })
        })

        it('can change the layout of a preceeding solid', function() {

            function main(params, scope) {
                scope.solids[0].layout.size.x = 100
            }


            var c = [
                    unit(),
                    script(main.toString())
                ]
                // inspect(c)
            render(c)
                .then(function(r) {
                    // inspect(r)
                    r[0].should.containSubset({
                        layout: {
                            size: {
                                x: 100
                            }
                        }
                    })
                })
        })

        it('can run a script that generates craftml tags', function() {
            var u = unit()
            var spy = sinon.spy(u, 'create')

            function main(params) {
                return '<foo></foo>'
            }

            var c = [
                unit(),
                script(main.toString())
            ]

            var foo = craft(u, u)
                // inspect(c)

            var scope = new Scope()
            scope.foo = foo

            render(c, scope)
                .then(function(r) {
                    // inspect(r)

                    spy.should.have.been.calledTwice

                    match(r, [solid(), solid(), solid()])
                })

        })

        it('can run async', function(done) {

            function main(params, scope, cb) {
                setTimeout(function() {
                    cb(null, 101)
                }, 50)
            }

            var c = script(main.toString())

            // inspect(c)
            render(c)
                .then(function(r) {
                    // inspect(r)
                    r.should.be.equal(101)
                    done()
                })
        })


    })

    describe('openjsacd', function() {

        it('can run openjsacd main()', function() {

            var c = jscad('function main(){ return cube(); }')
                // inspect(c)

            render(c)
                .then(function(r) {
                    // inspect(r)
                    // should return a cube with six faces
                    r.should.have.property('csg')
                    r.csg.polygons.length.should.be.equal(6)
                })

        })

        it('can run two in an array', function() {

            var c = [jscad('function main(){ return cube(); }'),
                    jscad('function main(){ return cube().scale(2,2,2); }')
                ]
                // inspect(c)

            render(c)
                .then(function(r) {
                    // inspect(r)

                    r.should.have.length(2)

                    r[0].csg.getBounds()[1].x.should.be.equal(1)

                    r[1].csg.getBounds()[1].x.should.be.equal(2)

                })

        })

    })

    describe('parameters', function() {

        it('can inject default parameter values', function() {
            var u = unit()
            var spy = sinon.spy(u, 'create')

            var c = [
                parameter(a('name', 'p1'), a('default', 2), a('type', 'int')),
                parameter(a('name', 'p2'), a('default', '5'), a('type', 'string')),
                u
            ]

            // inspect(c)
            render(c)
                .then(function() {
                    spy.should.have.been.calledWith({
                        'p1': 2,
                        'p2': '5'
                    })

                })

        })

        it('can override default parameter values', function() {
            var u = unit()
            var spy = sinon.spy(u, 'create')

            var c = [
                parameter(a('name', 'p1'), a('default', 2), a('type', 'int')),
                parameter(a('name', 'p2'), a('default', 5), a('type', 'int')),
                u
            ]

            // inspect(c)
            var scope = new Scope()
            scope.parameters.p1 = 5

            render(c, scope)
                .then(function() {

                    spy.should.have.been.calledWith({
                        'p1': 5,
                        'p2': 5
                    })
                })

        })

        it('can inject tag attribues as parameters to an inner craft', function() {
            var u = unit()
            var spy = sinon.spy(u, 'create')

            var c = [
                craft(a('name', 'foo'),
                    parameter(a('name', 'p1'), a('default', 2), a('type', 'int')),
                    u),
                foo(a('p1', 5))
            ]

            // inspect(c)

            render(c)
                .then(function() {
                    spy.should.have.been.calledWith({
                        'p1': 5
                    })
                })
        })


        it('can inject a string attribue, automatically cast as int, to an inner craft', function() {
            var u = unit()
            var spy = sinon.spy(u, 'create')

            var c = [
                craft(a('name', 'foo'),
                    parameter(a('name', 'p1'), a('default', 2), a('type', 'int')),
                    u),
                foo(a('p1', '5'))
            ]

            // inspect(c)


            render(c)
                .then(function() {

                    spy.should.have.been.calledWith({
                        'p1': 5
                    })
                })

        })

        it('can inject default parameter values to an inner craft', function() {
            var u = unit()
            var spy = sinon.spy(u, 'create')

            var c = [
                craft(a('name', 'foo'),
                    parameter(a('name', 'p1'), a('default', 2), a('type', 'int')),
                    parameter(a('name', 'p2'), a('default', 10), a('type', 'int')),
                    u),
                foo()
            ]

            // inspect(c)

            render(c)
                .then(function() {
                    spy.should.have.been.calledWith({
                        'p1': 2,
                        'p2': 10
                    })
                })
        })


        it('can resolve {{param}} from default parameter values', function() {
            var u = unit()
            var spy = sinon.spy(u, 'create')

            var c = [
                parameter(a('name', 'q1'), a('default', 10), a('type', 'int')),
                craft(a('name', 'foo'),
                    parameter(a('name', 'p1'), a('default', 2), a('type', 'int')),
                    u),
                foo(a('p1', '{{q1}}'))
            ]

            // inspect(c)

            render(c)
                .then(function() {
                    spy.should.have.been.calledWith({
                        'p1': 10
                    })
                })


        })

        it('can resolve {{param}} from supplied parameter values', function() {
            var u = unit()
            var spy = sinon.spy(u, 'create')

            var c = [
                parameter(a('name', 'q1'), a('default', 10), a('type', 'int')),
                craft(a('name', 'foo'),
                    parameter(a('name', 'p1'), a('default', 2), a('type', 'int')),
                    u),
                foo(a('p1', '{{q1}}'))
            ]

            // inspect(c)

            var scope = new Scope()
            scope.parameters = {
                q1: 20
            }
            render(c, scope)
                .then(function() {
                    spy.should.have.been.calledWith({
                        'p1': 20
                    })
                })
        })
    })



})