var chai = require('chai').should()

var Script = require('../lib/script'),
    Solid = require('../lib/solid')

describe('Script', function() {

    describe('text/openjscad cube()}', function() {

        var script = new Script()
        script.text = ('function main(){ return cube(); }')
        script.type = 'text/openjscad'
        var solid = script.render()

        it('should return a solid cube', function() {
            solid.should.be.instanceOf(Solid)
            solid.should.have.property('csg')
            solid.csg.should.have.property('polygons')
        })

        it('should compute layout width, height, depth', function() {

            solid.should.have.property('layout').have.property('width')
            solid.layout.width.should.equal(1)
            solid.layout.height.should.equal(1)
            solid.layout.depth.should.equal(1)
        })

    })

    describe('text/craftml <cube></cube>', function() {

        var script = new Script()
        script.text = ('function main(){ return "<cube></cube>";}')
        script.type = 'text/craftml'
        var solid = script.render()

        it('should return [solid cube]', function() {
            solid.should.have.length(1)
            // solid[0].should.be.instanceOf(Solid)
            // console.log(solid[0])
            solid[0].children[0].should.have.property('csg')
            solid[0].children[0].csg.should.have.property('polygons')
        })

    })    

})