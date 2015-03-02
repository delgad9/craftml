var chai = require('chai'),
    fs = require('fs'),
    inspect = require('eyes').inspector(),
    chaiSubset = require('chai-subset')

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
    grp = mock.grp,
    content = mock.content,
    foo = mock.foo,
    text = mock.text

var parse = require('../lib/parse')

describe('parse()', function() {

    it('craft', function() {

        parse('<craft></craft>')
            .then(function(t) {
                // inspect(t)
                t.should.containSubset(craft())
            })

    })

    it('foo', function() {

        parse('<foo></foo>')
            .then(function(t) {
                t.should.containSubset(foo())
            })

    })

    it('foo,foo', function() {

        parse('<foo></foo><foo></foo>')
            .then(function(t) {
                t.should.containSubset([foo(), foo()])
            })

    })

    it('craft(foo,foo)', function() {

        parse('<craft><foo></foo><foo></foo></craft>')
            .then(function(t) {
                t.should.containSubset(craft(foo(), foo()))
            })

    })

    it('craft(foo(foo(foo)))', function() {

        parse('<craft><foo><foo><foo></foo></foo></foo></craft>')
            .then(function(t) {
                t.should.containSubset(craft(foo(foo(foo()))))
            })

    })

    it('craft(name="a", id="b")', function() {

        parse('<craft name="a" id="b"></craft>')
            .then(function(t) {
                t.should.containSubset(craft(a('name', 'a'), a('id', 'b')))
            })
    })

    it('craft(foo(x="1", y="1", z="1"))', function() {

        parse('<craft><foo x="1" y="1" z="{{p1}}"></foo></craft>')
            .then(function(t) {
                // inspect(t)
                var e = foo((a('x', '1'), a('y', '1'), a('z', '{{p1}}')))
                    // inspect(e)
                t.children[0].should.containSubset(e)
            })



    })

    it('craft(craft(craft)))', function() {

        parse('<craft><craft></craft><craft></craft></craft>')
            .then(function(t) {
                t.should.containSubset(craft(craft(), craft()))
                t.children.should.have.length(2)
            })
    })

    it('craft(parameter)', function() {

        var expected = craft(parameter(a('name', 'p1'), a('default', '1'), a('type', 'int')))

        parse('<craft><parameter name="p1" default="1" type="int"></parameter></craft>')
            .then(function(t) {
                t.should.containSubset(expected)
            })
    })

    it('craft(hello world)', function() {

        parse('<craft>hello world</craft>')
            .then(function(t) {
                t.children[0].attribs.text.should.be.equal('hello world')
            })

    })

    it.skip('craft(row("hello world")) can ignore white spaces', function() {

        var t = parse('<craft>\n\n<row>hello world</row>\n\n</craft>')
            // inspect(t)      

    })

    describe('script', function() {

        it('script craftml', function() {

            parse('<craft><script type="text/craftml">function main(){}</script></craft>')
                .then(function(actual) {
                    actual.children[0].type.should.be.equal('script')
                    actual.children[0].code.should.be.equal('function main(){}')
                })

        })

        it('script craftml include a script locally', function() {

            parse('<craft><script type="text/craftml" src="test/fixtures/cube.js"></script></craft>')
                .then(function(actual) {
                    inspect(actual)
                    actual.children[0].type.should.be.equal('script')
                    actual.children[0].code.should.contain('main()')
                })

        })

        it('script openjscad', function() {

            parse('<craft><script type="text/openjscad">function main(){}</script></craft>')
                .then(function(actual) {
                    // inspect(actual)        
                    actual.children[0].type.should.be.equal('factory')
                    actual.children[0].code.should.be.equal('function main(){}')
                })

        })

    })

    describe('#import', function() {
        it('can load a craft via src', function() {
            return parse('<craft><craft src="test/fixtures/foo.xml" name="foo"/></craft>')
                .then(function(actual) {
                    inspect(actual)
                    actual.children[0].children[0].should.containSubset({
                        type: 'tag',
                        name: 'foo'
                    })
                })
        })

        it.only('can load a craft recuresively', function() {
            return parse('<craft><craft src="test/fixtures/bar.xml" name="bar"/></craft>')
                .then(function(actual) {
                    inspect(actual)
                    actual.children[0].children[0].children[0].should.containSubset({
                        type: 'tag',
                        name: 'foo'
                    })
                })
        })
    })

    describe('#module', function() {

        it('can load an installed module', function() {
            parse('<craft><craft module="craft-box" name="foo"/></craft>')
                .then(function(actual) {
                    // inspect(actual)                    
                    // inspect(e)
                    actual.children[0].children[0].type.should.be.equal('factory')
                    actual.children[0].children[0].code.should.contain('cube()')
                })
        })

    })

})