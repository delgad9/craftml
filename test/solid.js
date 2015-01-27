var chai = require('chai').should(),
    fs = require('fs'),
    $$$ = require('craft-scad')


var Solid = require('../lib').Solid

describe('Solid', function() {

    var solid = new Solid()
    solid.csgs = [$$$.cube(), $$$.cube({size:3})]

    describe('toStl()', function() {

        it('should return a stlstring', function() {
            solid.toStl().should.have.string('facet normal')
        })
    })

})