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

var parse = require('../lib/parse1')

describe('parse()', function() {

    it('craft', function() {

        var t = parse('<craft></craft>')

        t.should.containSubset(craft())

    })

    it('foo', function() {

        var t = parse('<foo></foo>')

        t.should.containSubset(foo())

    })

    it('foo,foo', function() {

        var t = parse('<foo></foo><foo></foo>')

        t.should.containSubset([foo(), foo()])

    })

    it('craft(foo,foo)', function() {

        var t = parse('<craft><foo></foo><foo></foo></craft>')

        t.should.containSubset(craft(foo(), foo()))

    })

    it('craft(foo(foo(foo)))', function() {

        var t = parse('<craft><foo><foo><foo></foo></foo></foo></craft>')

        t.should.containSubset(craft(foo(foo(foo()))))

    })

    it('craft(name="a", id="b")', function() {

        var t = parse('<craft name="a" id="b"></craft>')
            // inspect(t)
        t.should.containSubset(craft(a('name', 'a'), a('id', 'b')))

    })

    it('craft(foo(x="1", y="1", z="1"))', function() {

        var t = parse('<craft><foo x="1" y="1" z="{{p1}}"></foo></craft>')
        // inspect(t)
        t.children[0].should.containSubset(foo((a('x','1'),a('y','1'),a('z','{{p1}}'))))

    })    

    it('craft(craft(craft)))', function() {

        var t = parse('<craft><craft></craft><craft></craft></craft>')
        t.should.containSubset(craft(craft(), craft()))
        t.children.should.have.length(2)

    })

    it('craft(parameter)', function() {

        var actual = parse('<craft><parameter name="p1" default="1" type="int"></parameter></craft>')
        // inspect(actual)
        var expected = craft(parameter(a('name','p1'), a('default','1'), a('type','int')))
        // inspect(expected)
        actual.should.containSubset(expected)

    })

    it('craft(hello world)', function() {

        var t = parse('<craft>hello world</craft>')        
        t.children[0].attribs.text.should.be.equal('hello world')

    })    

    it('craft(row("hello world")) can ignore white spaces', function() {

        var t = parse('<craft>\n\n<row>hello world</row>\n\n</craft>')        
        // inspect(t)      

    })    


    it('script craftml', function() {

        var actual = parse('<craft><script type="text/craftml">function main(){}</script></craft>')
        // inspect(actual)
        actual.children[0].type.should.be.equal('script')
        actual.children[0].code.should.be.equal('function main(){}')

    })

    it('script openjscad', function() {

        var actual = parse('<craft><script type="text/openjscad">function main(){}</script></craft>')
        // inspect(actual)        
        actual.children[0].type.should.be.equal('factory')
        actual.children[0].code.should.be.equal('function main(){}')

    })

    describe('#module', function(){

        it('can load an installed module', function(){
            var actual = parse('<craft><craft module="craft-box" name="foo"/></craft>')
            // inspect(actual)

            actual.children[0].children[0].type.should.be.equal('factory')
            actual.children[0].children[0].code.should.contain('cube()')

        })


    })

})