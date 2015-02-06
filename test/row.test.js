 var chai = require('chai').should()

 var Solid = require('../lib/solid'),
     Row = require('../lib/row'),
     Script = require('../lib/script')

 describe('Row', function() {

     var script = new Script()
     script.text = ('function main(){ return cube(); }')
     script.type = 'text/openjscad'
     var row = new Row()
     row.children = [script, script, script]

     it('can be created three Script objects', function() {
         row.should.be.ok
         row.children.should.have.length(3)
     })

     describe('render()', function() {

         var solid = row.render()

         it('should return a solid with three child solids', function() {
             solid.should.exist()
             solid.should.be.instanceOf(Solid)
             solid.children.should.have.length(3)
         })

         it('children should lineup along the x-axis', function() {
             var s0 = solid.children[0]
             var s1 = solid.children[1]
             var s2 = solid.children[2]             

             s1.layout.location.x.should.be.equal(
                 s0.layout.location.x +
                 s0.layout.size.x)

             s2.layout.location.x.should.be.equal(
                 s1.layout.location.x +
                 s1.layout.size.x)
         })

         it('dimensions should fit to the children', function() {
             solid.layout.size.x.should.be.equal(3)
             solid.layout.size.y.should.be.equal(1)
             solid.layout.size.z.should.be.equal(1)
         })

     })

 })