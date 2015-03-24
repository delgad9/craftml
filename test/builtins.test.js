var chai = require('chai'),
    inspect = require('eyes').inspector(),
    _ = require('lodash')

chai.should()

var loadPromise = require('../lib/primitives')

var mock = require('./mock')

var a = mock.a,
    tag = mock.tag

var render = require('../lib/render')

describe('builtins', function() {

    var builtins

    before(function() {

        return loadPromise
            .then(function(results) {
                builtins = results
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
                        s.layout.location.x.should.be.equal(-5)
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
                        s.layout.location.x.should.be.equal(-15)
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

                    zs.should.be.eql([-2.5, -10, -2.5, -2.5])
                })

        })

    })

})