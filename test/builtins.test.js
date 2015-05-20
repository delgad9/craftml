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

    describe('rotate', function() {

        it('cube x-axis 90 degrees', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.group,
                builtins.rotate,
                tag('rotate', a('axis', 'x'), a('degrees', 90),
                    tag('cube', a('ysize', 20))))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    // inspect(solids)
                    solids[0].layout.size.z.should.be.eql(20)
                })
        })

        it('cube z-axis 90 degrees', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.group,
                builtins.rotate,
                tag('rotate', a('axis', 'z'), a('degrees', 90),
                    tag('cube', a('ysize', 20))))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    // inspect(solids)
                    solids[0].layout.size.x.should.be.eql(20)
                })
        })

    })

    describe('lineup', function() {

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

    describe('scale', function() {

        it('can scale by a factor of 2', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.group,
                builtins.scale,
                tag('scale', a('factor', 2),
                    tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    // inspect(solids[0].layout)
                    solids[0].layout.size.should.be.eql({
                        x: 20,
                        y: 20,
                        z: 20
                    })
                })
        })

        it('can scale by x=2 y=3 z=4', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.group,
                builtins.scale,
                tag('scale', a('x', 2), a('y', 3), a('z', 4),
                    tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    // inspect(solids[0].layout)
                    solids[0].layout.size.should.be.eql({
                        x: 20,
                        y: 30,
                        z: 40
                    })
                })
        })
    })

    describe('resize', function() {

        it('should resize a cube to 5x10x20', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.group,
                builtins.resize,
                tag('resize', a('x', 5), a('y', 10), a('z', 20),
                    tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    // inspect(solids[0].layout)
                    solids[0].layout.size.should.be.eql({
                        x: 5,
                        y: 10,
                        z: 20
                    })
                })
        })
    })

    describe('align', function() {


        it('x=0%', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.align,
                tag('align', a('x', '0%'),
                    tag('cube', a('x', -5)), tag('cube'), tag('cube'), tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {
                    // inspect(r.length)

                    _.forEach(solids, function(s) {
                        // inspect(s.layout)
                        s.layout.location.x.should.be.eql(-5)
                    })
                })

        })

        it('y=0% x=100%', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.align,
                tag('align', a('y', '0%'), a('x', '100%'),
                    tag('cube', a('y', -5)), tag('cube', a('x', -10)), tag('cube'), tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {

                    _.forEach(solids, function(s) {
                        // inspect(s.layout.location)
                        s.layout.location.y.should.be.equal(-5)
                        s.layout.location.x.should.be.equal(0)
                    })
                })

        })

        it('z=50%', function() {
            var c = tag('craft',
                builtins.cube,
                builtins.align,
                tag('align', a('z', '50%'),
                    tag('cube', a('y', -5)), tag('cube', a('zsize', 20)), tag('cube'), tag('cube')))

            // inspect(c)
            return render(c)
                .then(function(solids) {

                    var zs = _.map(solids, function(s) {
                        // inspect(s.layout.location)
                        return s.layout.location.z
                    })

                    zs.should.be.eql([0, -5, 0, 0])
                })

        })

    })

})
