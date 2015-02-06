var chai = require('chai'),
    fs = require('fs')

var chaiSubset = require('chai-subset')
chai.should()
chai.use(chaiSubset)

var craft = require('../lib'),
    Script = require('../lib/script'),
    Stack = require('../lib/stack'),
    Craft = require('../lib/craft'),
    CraftRef = require('../lib/craftref')

describe('parse', function() {
    it('script1.xml\'s contents should have one script block', function() {

        var xml = fs.readFileSync('test/fixtures/script1.xml', 'utf8')
        var c = craft.parse(xml)
        c.children.should.have.length(1)
        c.children[0].should.be.instanceOf(Script)

        var script = c.children[0]
        script.should.have.property('text')
        script.text.should.have.string('cube()')
        script.type.should.be.equal('text/openjscad')

    })

    it('script2.xml\'s contents should have two script blocks ', function() {

        var xml = fs.readFileSync('test/fixtures/script2.xml', 'utf8')
        var c = craft.parse(xml)
        c.children.should.have.length(2)
        c.children[0].should.be.instanceOf(Script)
        c.children[1].should.be.instanceOf(Script)

        var script = c.children[0]
        script.should.have.property('text')
        script.text.should.have.string('cube()')
        script.type.should.be.equal('text/openjscad')

        var script = c.children[1]
        script.should.have.property('text')
        script.text.should.have.string('cylinder()')
        script.type.should.be.equal('text/openjscad')

    })

    it('stack.xml ==> [stack, [script, script]]', function() {

        var xml = fs.readFileSync('test/fixtures/stack.xml', 'utf8')
        var c = craft.parse(xml)
        c.children.should.have.length(1)
        c.children[0].should.be.instanceOf(Stack)
        c.children[0].children.should.have.length(2)
        c.children[0].children[0].should.be.instanceOf(Script)
        c.children[0].children[1].should.be.instanceOf(Script)

    })

    it('nested.xml ==> [craft, ref]', function() {

        var xml = fs.readFileSync('test/fixtures/nested.xml', 'utf8')
        var c = craft.parse(xml)

        c.children.should.have.length(2)
        c.children[0].should.be.instanceOf(Craft)
        c.children[1].should.be.instanceOf(CraftRef)

    })

    it('import.xml ==> [craft, ref]', function() {

        var xml = fs.readFileSync('test/fixtures/import.xml', 'utf8')
        var c = craft.parse(xml)

        c.children.should.have.length(2)
        c.children[0].should.be.instanceOf(Craft)
        c.children[1].should.be.instanceOf(CraftRef)

    })

    describe('text', function() {

        it('can parse hello world', function() {

            var xml = '<craft>hello world</craft>'
            var c = craft.parse(xml)

            c.should.containSubset({
                "children": [{
                    "text": "hello world"
                }]
            })
        })

        it('can ignore white spaces', function() {

            var xml = '<craft>\n\n<board>hello world</board>\n\n</craft>'
            var c = craft.parse(xml)

            c.should.not.containSubset({
                "children": [{
                    "text": "\n\n"
                }]
            })
        })
    })

    describe('module', function() {

        it('can load module', function() {

            //
            // test/craft-simple/index.xml:
            // <craft><box></box></craft>
            //
            var xml = '<craft><craft name="test" module="test/craft-simple"/></craft>'
            var c = craft.parse(xml)

            c.should.containSubset({
                class: 'Craft',
                children: [{
                    class: 'Craft',
                    children: [{
                        ref: 'box'
                    }]
                }]
            });
        })

        it('can load a module that includes another xml', function() {

            var xml = '<craft><craft name="test" module="test/craft-box"/></craft>'
                //
                // test/craft-box/index.xml:
                // <craft><craft name="boxpart" src="./part.xml"></craft><box></box></craft>
                //
                // test/craft-box/part.xml:
                // <craft><part></part></craft>
                //

            var c = craft.parse(xml)

            c.should.containSubset({
                "children": [{
                    "children": [{
                        "children": [],
                        "ref": "box",
                        "class": "CraftRef"
                    }, {
                        "children": [{
                            "children": [],
                            "ref": "part",
                            "class": "CraftRef"
                        }],
                        "class": "Craft",
                        "name": "boxpart"
                    }],
                    "class": "Craft",
                    "name": "test"
                }],
                "class": "Craft"
            });
        })

        it('can load a module that uses another module', function() {

            var xml = '<craft><craft name="test" module="test/craft-2boxes"/></craft>'
                //
                // test/craft-2boxes/index.xml:
                //
                // <craft>
                //     <craft name="box" module="test/craft-box"></craft>
                //     <box></box>
                //     <box></box>
                // </craft>
                //
                //

            var c = craft.parse(xml)

            c.should.containSubset({
                "children": [{
                    "children": [{
                        "children": [{
                            "children": [],
                            "ref": "box",
                            "class": "CraftRef"
                        }, {
                            "children": [{
                                "children": [],
                                "ref": "part",
                                "class": "CraftRef"
                            }],
                            "class": "Craft",
                            "name": "boxpart"
                        }],
                        "class": "Craft",
                        "name": "box"
                    }, {
                        "children": [],
                        "ref": "box",
                        "class": "CraftRef"
                    }, {
                        "children": [],
                        "ref": "box",
                        "class": "CraftRef"
                    }],
                    "class": "Craft",
                    "name": "test"
                }],
                "class": "Craft"
            });
        })
    })
})