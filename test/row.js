 var chai = require('chai').should()

 var Solid = require('../lib').Solid,
     Row = require('../lib').Row,
     Script = require('../lib').Script

 describe('Row', function() {

     var script = new Script()
     script.text = ('function main(){ return cube(); }')
     var row = new Row([script, script, script])

     it('can be created three Script objects', function() {
         row.should.be.ok
         row.contents.should.have.length(3)
     })

     describe('.render()', function() {

         var solid = row.render()

         it('should return a solid with three child solids', function() {
             solid.should.be.ok()
             solid.should.be.instanceOf(Solid)
             solid.children.should.have.length(3)
         })

         it('children should lineup along the x-axis', function() {
             var s0 = solid.children[0]
             var s1 = solid.children[1]
             var s2 = solid.children[2]

             s1.layout.x.should.be.equal(
                 s0.layout.x +
                 s0.layout.width)

             s2.layout.x.should.be.equal(
                 s1.layout.x +
                 s1.layout.width)
         })

         it('dimensions should fit to the children', function() {
             solid.layout.width.should.be.equal(3)
             solid.layout.height.should.be.equal(1)
             solid.layout.depth.should.be.equal(1)
         })

     })

 })