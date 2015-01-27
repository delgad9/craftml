var chai = require('chai').should(),
    fs = require('fs')

var craft = require('../lib')

describe('parse', function() {
    it('script1.xml\'s contents should have one script block', function() {

        var xml = fs.readFileSync('test/fixtures/script1.xml', 'utf8')
        var c = craft.parse(xml)
        c.contents.should.have.length(1)
        c.contents[0].should.be.instanceOf(craft.Script)

        var script = c.contents[0]
        script.should.have.property('text')
        script.text.should.have.string('cube()')
        script.type.should.be.equal('text/openjscad')

    })

    it('script2.xml\'s contents should have two script blocks ', function() {

        var xml = fs.readFileSync('test/fixtures/script2.xml', 'utf8')
        var c = craft.parse(xml)
        c.contents.should.have.length(2)
        c.contents[0].should.be.instanceOf(craft.Script)
        c.contents[1].should.be.instanceOf(craft.Script)

        var script = c.contents[0]
        script.should.have.property('text')
        script.text.should.have.string('cube()')
        script.type.should.be.equal('text/openjscad')

        var script = c.contents[1]
        script.should.have.property('text')
        script.text.should.have.string('cylinder()')
        script.type.should.be.equal('text/openjscad')

    })
})