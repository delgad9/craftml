 var chai = require('chai').should()

 var Place = require('../lib/place'),
     Script = require('../lib/script')

 describe('Place', function() {

     var script = new Script()
     script.text = 'function main(){ return cube(); }'

     describe('render()', function() {

         it('can inject contents available through scope', function() {
             var place = new Place()
             place.name = 'contents'

             var scope = new Scope()
             scope.contents = [script, script, script]             

             var c = place.render(scope)
             c.should.have.length(3)

         })

     })
 })