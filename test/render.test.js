var chai = require('chai'),
    assert = require('chai').assert,
    sinon = require("sinon"),
    sinonChai = require("sinon-chai"),
    debug = require('debug')('craftml.test.render')

chai.should()
chai.use(sinonChai);

var render = require('../lib/render'),
    Solid = require('../lib/solid1'),
    chaiSubset = require('chai-subset'),
    inspect = require('eyes').inspector(),
    EventEmitter = require("events").EventEmitter


// mock stuff
var f = {}
    // reserved words
make(f, 'craft')
make(f, 'parameter')
make(f, 'content')
make(f, 'script')
make(f, 'u1')
make(f, 'u2')
make(f, 'csg')
make(f, 'foo')
make(f, 'factory')
make(f, 'unit')
make(f, 'group')

makea('p1')
makea('def', 'default')
makea('type')

// function MockScript() {
//     this.name = "script"
// }
// _.extend(MockScript.prototype, EventEmitter.prototype)
// MockScript.prototype.constructor = MockScript
// MockScript.prototype.eval = function() {
//     this.emit('render')
// }

// function script() {
//     return new MockScript()
// }
// Script 

function id(id) {
    return {
        a: {
            id: id
        }
    }
}

function name(name) {
    return {
        a: {
            name: name
        }
    }
}

function a(name, value) {
    var o = {}
    o[name] = value
    return {
        a: o
    }
}

function makea(name, as) {

    var f = function(val) {
        var o = {}
        if (as)
            o[as] = val
        else
            o[name] = val
        return {
            a: o
        }
    }


    eval(name + ' = f')
}


function make(f, name) {

    var f = function() {
        var args = Array.prototype.slice.call(arguments)

        var el = {
            type: 'tag',
            name: name,
            attribs: {}
        }

        var children = []

        args.forEach(function(arg) {

            if ('a' in arg) {
                _.extend(el.attribs, arg.a)

            } else {

                children.push(arg)
            }

            // console.log('arg',arg)

        })

        // console.log(el.attribs)

        if (name === 'script' || name === 'factory' || name === 'unit') {
            el.type = 'factory'
            // el.attribs.type = 'text/openjscad'
            el.create = function() {
                var s = new Solid()
                s.layout = {
                    size: {
                        x: 1,
                        y: 1,
                        z: 1
                    },
                    location: {
                        x: 0,
                        y: 0,
                        z: 0
                    }
                }
                return s
            }
            delete el.children

        } else {
            //el.type = 'tag'
            el.children = children
        }

        return el
    }

    eval(name + ' = f')
}


function solid() {
    return {
        type: 'solid'
    }
}


function grp() {
    var args = Array.prototype.slice.call(arguments)

    return {
        type: 'group',
        children: args
    }
}

function match(actual, expected) {


    if (_.isArray(expected) && _.isArray(actual)) {

        actual.should.have.length(expected.length)

        for (var i = 0; i < actual.length; i++) {

            actual[i].type.should.be.equal(expected[i].type)

        }

    } else {

        actual.type.should.be.equal(expected.type)

        if (actual.children)
            match(actual.children, expected.children)

    }

}

describe('render#', function() {

    it('can render a single unit', function() {

        var c = unit()

        var r = render(c)

        match(r, solid())
    })

    it('can render an array of two units', function() {

        var c = [unit(), unit()]

        var r = render(c)

        match(r, [solid(), solid()])
    })

    it('can render a group of two units', function() {

        var c = group(unit(), unit())

        var r = render(c)

        match(r,
            grp(solid(),
                solid()))
    })

    it('can render a group of two units within another group', function() {

        var c = group(unit(), group(unit(), unit()))
            // inspect(c)

        var r = render(c)
            // inspect(r)

        match(r,
            grp(solid(),
                grp(solid(),
                    solid())))
    })

    it('does not render <craft> to anything', function() {

        var c = craft(unit())
            // inspect(c)

        var r = render(c)
            // inspect(r)

        assert.isUndefined(r)

    })

    it('can resolve <foo> to <craft name="foo"><unit>', function() {

        var c = [
            craft(a('name', 'foo'),
                unit()),
            foo()
        ]

        // inspect(c)

        var r = render(c)
            // inspect(r)

        match(r, [solid()])

    })

    it('can resolve <foo> three times', function() {

        var c = [
            craft(a('name', 'foo'),
                unit()),
            foo(),
            foo(),
            foo()
        ]

        // inspect(c)

        var r = render(c)
        // inspect(r)

        match(r, [solid(), solid(), solid()])

    })


    it.only('can apply default parameter', function() {
        var u = unit()
        var spy = sinon.spy(u, 'create')

        var c = [
            parameter(a('name','p1'), a('default',2), a('type','int')),
            parameter(a('name','p2'), a('default',5), a('type','int')),
            u
        ]

        // inspect(c)
        var r = render(c)
        
        spy.should.have.been.calledWith({'p1':2,'p2':5})
        
    })

    // it.only('can override with default parameter', function() {
    //     var u = unit()
    //     var spy = sinon.spy(u, 'create')

    //     var c = [
    //         parameter(a('name','p1'), a('default',2), a('type','int')),
    //         u,
    //         u
    //     ]

    //     // inspect(c)
    //     var r = render(c)
        
    //     spy.should.have.been.calledWith({'p1':2})
        
    // })

    // describe('mock script', function() {

    //     it('a script is evaluated once', function() {

    //         var spy = sinon.spy()
    //         var c = script()

    //         c.eval = spy
    //         render(c)

    //         spy.should.have.been.calledOnce
    //     })


    //     it('a craft\'s children scripts are both evaluated', function() {

    //         var c = craft(script(), script())

    //         c.children[0].eval = sinon.spy()
    //         c.children[1].eval = sinon.spy()

    //         render(c)

    //         c.children[0].eval.should.have.been.calledOnce
    //         c.children[1].eval.should.have.been.calledOnce

    //     })

    //     it('an array of scripts are all evaluated', function() {

    //         var c = [script(), script()]

    //         c[0].eval = sinon.spy()
    //         c[1].eval = sinon.spy()

    //         render(c)

    //         c[0].eval.should.have.been.calledOnce
    //         c[1].eval.should.have.been.calledOnce

    //     })

    //     it.only('an embedded script', function() {

    //         var s = script()

    //         var c = [
    //             craft(name('foo'),
    //                 parameter(a('name','p1'), a('default',3), a('type','int')),
    //                 script()),
    //             foo(p1('a')),
    //             foo(p1('b'))
    //         ]

    //         var d = [csg(),csg()]
    //         inspect(c)
    //         render(c)
    //         inspect(d)

    //     })

    // })


})