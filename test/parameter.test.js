var chai = require('chai'),
    fs = require('fs')

var inspect = require('eyes').inspector()
    

var chaiSubset = require('chai-subset')
chai.should()
chai.use(chaiSubset)

var craft = require('../lib'),
    Parameter = require('../lib/parameter')

describe('parameter', function() {
    it('can parse one parameter', function() {

        var xml = '<craft><parameter name="foo" default="3" type="int"/></craft>'
        var c = craft.parse(xml)
        c.contents.should.have.length(1)

        var e = c.contents[0]
        e.on('render', function(element, scope){            
            scope.parameters.should.have.property('foo').equal(3)
        })

        c.render()
    })

    it('can read default value of `int` type', function() {

        var xml = '<craft><parameter name="foo" default="3" type="int"/></craft>'
        var c = craft.parse(xml)        

        var e = c.contents[0]
        e.on('render', function(element, scope){            
            scope.parameters.should.have.property('foo').equal(3)
        })

        c.render()
    })    

    it('can read default value of `string` type', function() {

        var xml = '<craft><parameter name="foo" default="3" type="string"/></craft>'
        var c = craft.parse(xml)        

        var e = c.contents[0]
        e.on('render', function(element, scope){            
            scope.parameters.should.have.property('foo').equal('3')
        })

        c.render()
    })        

    it('can handle multiple parameters', function() {

        var xml = '<craft><parameter name="foo"/><parameter name="bar"/><parameter name="tee"/></craft>'
        var c = craft.parse(xml)
        c.contents.should.have.length(3)

        var e = c.contents[0]
        e.on('render', function(element, scope){            
            scope.parameters.should.have.property('foo')
            scope.parameters.should.have.property('bar')
            scope.parameters.should.have.property('tee')
        })

        c.render()
    })

     it('custom paramter values should override default parameter values', function() {

        var xml = '<craft><parameter name="foo"/><parameter name="bar" default="3" type="int"/></craft>'
        var c = craft.parse(xml)

        var e = c.contents[0]
        e.on('render', function(element, scope){            
            scope.parameters.should.have.property('foo').equal(5)
            scope.parameters.should.have.property('bar').equal(3)
        })

        var scope = new Scope()
        scope.parameters = {foo:5}
        c.render(scope)
    })

    it('attributes should be set as parameters to nested crafts', function() {

        var xml = '<craft><craft name="box"><parameter name="bar" type="int"/><row></row></craft><box bar="3"></box></craft>'
        var c = craft.parse(xml)

        // <box bar="3">
        c.contents[1].on('render', function(element, scope){            
            // inspect(scope.parameters)
            scope.parameters.should.have.property('bar').equal('3')
        })

        // <craft name="box"><row>
        c.contents[0].contents[1].on('render', function(element, scope){            
            // inspect(scope.parameters)
            scope.parameters.should.have.property('bar').equal(3)
        })

        c.render()
    })
})