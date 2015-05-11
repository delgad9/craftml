var chai = require('chai'),
    fs = require('fs'),
    inspect = require('eyes').inspector(),
    chaiSubset = require('chai-subset')
    // S = require('./solid')

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
    _s = require('../lib/solids')

    _loadPrimitives = craft._test._loadPrimitives,
    _apply = craft._test._applyTransformation

describe('#craft', function() {

    describe('preview()', function() {

        it('can preview a cube', function() {

            return preview('<craft><cube></cube></craft>')
                .then(function(previewable) {
                    previewable.csgs.should.have.length(1)
                })
                // inspect(v)
        })

        it('can preview two cubes', function() {

            return preview('<craft><cube></cube><cube></cube></craft>')
                .then(function(previewable) {
                    previewable.csgs.should.have.length(2)
                })

        })

        it('can preview a parameterized cube', function() {

            return preview('<craft><cube xsize="100"></cube></craft>')
                .then(function(previewable) {
                    previewable.csgs.should.have.length(1)
                })
        })

    })

    describe('build()', function() {

        it('can build a cube', function() {

            return build('<craft><cube></cube></craft>')
                .then(function(v) {
                    // inspect(v)
                    v.should.have.property('polygons').and.have.length(6)
                })
        })

        it('can build a row of two cubes', function() {

            return build('<craft><row><cube></cube><cube></cube></row></craft>')
                .then(function(v) {
                    // inspect(v)                    
                    v.should.have.property('polygons').and.have.length(10)
                })
        })

    })

    describe('_loadPrimitives()', function() {

        it('can load', function() {

            return _loadPrimitives()
                .then(function(ret) {
                    // inspect(ret)
                    ret.should.have.property('cube').and.containSubset({
                        type: 'tag',
                        name: 'craft'
                    })
                    ret.should.have.property('sphere').and.containSubset({
                        type: 'tag',
                        name: 'craft'
                    })
                    ret.should.have.property('cylinder').and.containSubset({
                        type: 'tag',
                        name: 'craft'
                    })
                })
        })

    })

})
