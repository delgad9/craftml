var chai = require('chai'),
    sinon = require("sinon"),
    sinonChai = require("sinon-chai")

chai.should()
chai.use(sinonChai);

var render = require('../lib/render'),
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
make(f, 'foo')

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
        id: id
    }
}

function make(f, name) {

    var f = function() {
        var args = Array.prototype.slice.call(arguments)

        var el = {
            name: name,
            attribs: []
        }

        var children = []

        args.forEach(function(arg) {

            if ('id' in arg) {
                el.attribs.id = arg.id
            } else {

                children.push(arg)
            }

        })

        if (name === 'script') {

            el.type = 'text/openjscad'
            el.eval = function() {
                el.layout = {
                    size: {
                        x: 5,
                        y: 5,
                        z: 5
                    },
                    location: {
                        x: 0,
                        y: 0,
                        z: 0
                    }
                }
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


describe('NEW render', function() {

    describe('mock script', function() {

        it('a script is evaluated once', function() {

            var spy = sinon.spy()
            var c = script()

            c.eval = spy
            render(c)

            spy.should.have.been.calledOnce
        })


        it('a craft\'s children scripts are both evaluated', function() {

            var c = craft(script(), script())

            c.children[0].eval = sinon.spy()
            c.children[1].eval = sinon.spy()

            render(c)
            
            c.children[0].eval.should.have.been.calledOnce
            c.children[1].eval.should.have.been.calledOnce

        })

        it('an array of scripts are all evaluated', function() {

            var c = [script(), script()]

            c[0].eval = sinon.spy()
            c[1].eval = sinon.spy()

            render(c)
            
            c[0].eval.should.have.been.calledOnce
            c[1].eval.should.have.been.calledOnce

        })

    })

})