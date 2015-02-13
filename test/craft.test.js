var chai = require('chai'),
    fs = require('fs'),
    inspect = require('eyes').inspector(),
    chaiSubset = require('chai-subset')

chai.should()
chai.use(chaiSubset)

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
    foo = mock.foo,
    cube = mock.cube

var Solid = require('../lib/solid')

var craft = require('../lib/craft'),
    build = craft.build,
    preview = craft.preview,
    
    _loadPrimitives = craft._test._loadPrimitives
    _apply = craft._test._applyTransformation

describe('#craft', function() {

    describe('preview()', function(){

        it('can preview a cube', function(){

            var v = preview('<craft><cube></cube></craft>')
            // inspect(v)
            v.csgs.should.have.length(1)
        })

        it('can preview two cubes', function(){

            var v = preview('<craft><cube></cube><cube></cube></craft>')
            v.csgs.should.have.length(2)
        })

        it('can preview a parameterized cube', function(){

            var v = preview('<craft><cube xsize="100"></cube></craft>')
            // inspect(v)
            v.csgs.should.have.length(1)
        })

    })

    describe('_loadPrimitives()', function(){

        it('can load', function(){

            _loadPrimitives()

        })

    })

    describe('_applyTranformation()', function() {

        it('can handle a unit cube', function() {

            var t = cube()
                // inspect(t)
            _apply(t)

            should.be.ok            
        })

        it('can handle a group of cubes', function() {

            var t = solidGroup(cube(), cube())
                // inspect(t)

            _apply(t)
                // inspect(b)

            should.be.ok            
        })

        it('can translate a child cube w.t.r its parent', function() {

            var t = solidGroup(cube())
            t.layout.location = {
                x: 100,
                y: 20,
                z: 0
            }

            // inspect(t)

            _apply(t)

            // inspect(b)

            t.children[0].csg.getBounds()[0].x.should.be.equal(100)
            t.children[0].csg.getBounds()[0].y.should.be.equal(20)
            t.children[0].csg.getBounds()[0].z.should.be.equal(0)
        })

        it('can translate recursively', function() {

            var t = solidGroup(solidGroup(cube()))
            t.layout.location = {
                x: 100,
                y: 20,
                z: 0
            }
            t.children[0].layout.location = {
                x: 20,
                y: -20,
                z: -10
            }
            // inspect(t)

            _apply(t)
            // inspect(b)

            t.children[0].children[0].csg.getBounds()[0].x.should.be.equal(120)
            t.children[0].children[0].csg.getBounds()[0].y.should.be.equal(0)
            t.children[0].children[0].csg.getBounds()[0].z.should.be.equal(-10)
        })

    })

})