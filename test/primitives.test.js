var craft = require('../lib/craft'),
    render = require('../lib/render'),
    _loadPrimitives = craft._test._loadPrimitives

var inspect = require('eyes').inspector()


describe.skip('primitives', function() {

    var p

    beforeEach(function() {
        return _loadPrimitives()
            .then(function(ret) {
                p = ret
            })
    })


    describe('#scale', function() {

        it('can scale individual dimensions', function() {

            inspect(p.cube)

            render([p.cube])
                .then(function(r){
                    inspect(r)
                    // console.log(r)
                })

            // var c = scale(a('x', 3), a('y', 5), a('z', 4), unit())
            //     // inspect(c)

            // return render(c)
            //     .then(function(r) {

            //         // inspect(r)
            //         r.layout.should.containSubset({
            //             size: {
            //                 x: 3,
            //                 y: 5,
            //                 z: 4
            //             },
            //             scale: {
            //                 x: 3,
            //                 y: 5,
            //                 z: 4
            //             }
            //         })

            //     })

        })

        it('can scale multiple times', function() {


            // var c = scale(a('x', 2),
            //     scale(a('x', 3),
            //         unit()))

            // // inspect(c)

            // return render(c)
            //     .then(function(r) {

            //         // inspect(r)
            //         r.layout.should.containSubset({
            //             size: {
            //                 x: 6
            //             },
            //             scale: {
            //                 x: 2,
            //                 y: 1,
            //                 z: 1
            //             }
            //         })

            //     })

        })

    })

})