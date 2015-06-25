var chai = require('chai'),
    inspect = require('eyes').inspector(),
    _ = require('lodash')

chai.should()

var loadPromise = require('../lib/builtins')

var mock = require('./mock')

var a = mock.a,
    tag = mock.tag,
    parameter = mock.parameter

var render = require('../lib/render')

describe('builtins', function() {

    var builtins

    before(function() {

        return loadPromise
            .then(function(results) {
                builtins = results
            })
    })

    describe('primitive shapes', function() {

        it('circle', function(){
            var c = tag('craft',
                builtins.circle,
                tag('circle'))

            //inspect(c)
            return render(c)
                .then(function(solids) {
                    //solids[0].csg.polygons.should.have.length(6)
                })
        })

        it('cube 5x5x5', function() {
            var c = tag('craft',
                builtins.cube,
                tag('cube'))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    solids[0].csg.polygons.should.have.length(6)
                })
        })

        it('cylinder 5x5x5', function() {
            var c = tag('craft',
                builtins.cylinder,
                tag('cylinder'))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    solids[0].csg.polygons.should.have.length(72)
                })
        })

        it('sphere 5x5x5', function() {
            var c = tag('craft',
                builtins.sphere,
                tag('sphere'))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    solids[0].csg.polygons.should.have.length(648)
                })
        })

        it('sphere resolution=10', function() {
            var c = tag('craft',
                builtins.sphere,
                tag('sphere', a('resolution', 10)))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    solids[0].csg.polygons.should.have.length(60)
                })
        })
    })

    describe.skip('lineup', function() {

        it('axis=x', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.lineup,
                tag('lineup', a('axis', 'x'),
                    tag('cube'), tag('cube'), tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    // inspect(solids.length)
                    solids.should.have.length(3)
                    _.map(solids, function(s) {
                        return s.layout.location.x
                    }).should.be.eql([0, 10, 20])
                })
        })

        it('axis=y, spacing=2', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.lineup,
                tag('lineup', a('axis', 'y'), a('spacing', 2),
                    tag('cube'), tag('cube'), tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    // inspect(solids.length)
                    solids.should.have.length(3)
                    _.map(solids, function(s) {
                        return s.layout.location.y
                    }).should.be.eql([0, 12, 24])
                })
        })
    })

    describe('repeat', function() {

        it('n=5 cubes', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.repeat,
                tag('repeat', a('n', '5'),
                    tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                     //inspect(solids.length)

                    solids.should.have.length(5)
                })
        })

        it('n=5x2 cubes', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.repeat,
                tag('repeat', a('n', '5'),
                    tag('repeat', a('n', 2),
                        tag('cube'))))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                     //inspect(solids.length)

                    solids.should.have.length(10)
                })
        })

        it('can iterate through [1,2,3]', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.repeat,
                parameter(a('name', 'xs'), a('default', [1,2,3])),
                tag('repeat', a('each', 'x'),a('in','xs'),
                    tag('cube', a('xsize','{{x}}'))))

             //inspect(c)
            return render(c)
                .then(function(solids) {
                    _.map(solids, function(s) {
                        return s.layout.size.x
                    }).should.be.eql([1, 2, 3])
                })
        })

        it('can iterate through an inline array in attribute', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.repeat,
                tag('repeat', a('each', 'x'),a('in','[1,2,3]'),
                    tag('cube', a('xsize','{{x}}'))))

            //inspect(c)
            return render(c)
                .then(function(solids) {
                    _.map(solids, function(s) {
                        return s.layout.size.x
                    }).should.be.eql([1, 2, 3])
                })
        })
    })

    describe.skip('align', function() {

        it('align="x50 y50"', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.align,
                builtins.group,
                tag('group', a('align', 'x50 y50'),
                    tag('cube'), tag('cube', a('xsize',20))))

            // inspect(c)
            return render(c)
                .then(function(solids) {

                    _.forEach(solids, function(s) {
                        s.layout.location.x.should.be.eql(-5)
                    })
                })

        })


    })

})
