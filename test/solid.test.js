var chai = require('chai').should(),
    fs = require('fs'),
    $$$ = require('craft-scad')

var Solid = require('../lib/solid')

describe('Solid', function() {

    var solid = new Solid()
    solid.csg = $$$.cube()

    describe('toStl()', function() {

        it('should return a stlstring', function() {
            solid.toStl().should.have.string('facet normal')
        })
    })

})