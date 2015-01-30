var chai = require('chai').should()

var Craft = require('../lib/craft'),
    Script = require('../lib/script'),
    Scope = require('../lib/scope')

describe('Scope', function() {

    describe('getElement', function() {

        var scope = new Scope()

        it('ByName()', function() {

            var script = new Script()
            script.text = 'function main(){ return craft.getElementByName("foo");}'

            scope.addElement({
                name: 'foo',
                id: 1
            })

            var ret = script.execute(scope)
            ret.id.should.be.eql(1)

        })

    })
})