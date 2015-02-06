var chai = require('chai').should()

var Script = require('../lib/script'),
    Solid = require('../lib/solid')

describe('Script', function() {

    describe('render() function main(){ return cube();}', function() {

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

})