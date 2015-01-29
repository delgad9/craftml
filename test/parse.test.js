var chai = require('chai').should(),
    fs = require('fs')

var craft = require('../lib'),
    Script = require('../lib/script'),
    Stack = require('../lib/stack'),
    Craft = require('../lib/craft'),
    CraftRef = require('../lib/craftref')

describe('parse', function() {
    it('script1.xml\'s contents should have one script block', function() {

        var xml = fs.readFileSync('test/fixtures/script1.xml', 'utf8')
        var c = craft.parse(xml)
        c.contents.should.have.length(1)
        c.contents[0].should.be.instanceOf(Script)

        var script = c.contents[0]
        script.should.have.property('text')
        script.text.should.have.string('cube()')
        script.type.should.be.equal('text/openjscad')

    })

    it('script2.xml\'s contents should have two script blocks ', function() {

        var xml = fs.readFileSync('test/fixtures/script2.xml', 'utf8')
        var c = craft.parse(xml)
        c.contents.should.have.length(2)
        c.contents[0].should.be.instanceOf(Script)
        c.contents[1].should.be.instanceOf(Script)

        var script = c.contents[0]
        script.should.have.property('text')
        script.text.should.have.string('cube()')
        script.type.should.be.equal('text/openjscad')

        var script = c.contents[1]
        script.should.have.property('text')
        script.text.should.have.string('cylinder()')
        script.type.should.be.equal('text/openjscad')

    })

    it('stack.xml ==> [stack, [script, script]]', function() {

        var xml = fs.readFileSync('test/fixtures/stack.xml', 'utf8')
        var c = craft.parse(xml)
        c.contents.should.have.length(1)
        c.contents[0].should.be.instanceOf(Stack)
        c.contents[0].contents.should.have.length(2)
        c.contents[0].contents[0].should.be.instanceOf(Script)
        c.contents[0].contents[1].should.be.instanceOf(Script)

    })    

    it('nested.xml ==> [craft, ref]', function() {

        var xml = fs.readFileSync('test/fixtures/nested.xml', 'utf8')
        var c = craft.parse(xml)
        
        c.contents.should.have.length(2)
        c.contents[0].should.be.instanceOf(Craft)
        c.contents[1].should.be.instanceOf(CraftRef)        

    })    

    it('import.xml ==> [craft, ref]', function() {

        var xml = fs.readFileSync('test/fixtures/import.xml', 'utf8')
        var c = craft.parse(xml)
        
        c.contents.should.have.length(2)
        c.contents[0].should.be.instanceOf(Craft)
        c.contents[1].should.be.instanceOf(CraftRef)        

    })        
})