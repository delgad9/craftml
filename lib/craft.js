var debug = require('debug')('craft.craft')

module.exports = Craft

var Block = require('./block')

function Craft() {
}

Craft.prototype = new Block()
Craft.prototype.constructor = Craft


// Craft.prototype.doLayout = rowLayout

// Craft.prototype.render = function(scope) {
//     scope = scope || {}

//     // compute scope
//     var scope = _.clone(scope)
//     this.contents.forEach(function(block) {
//         if (block.constructor.name === 'Craft') {
//             scope[block.name] = block
//         }
//     })

//     // render all contents nodes to solids
//     var solids = _(this.contents)
//         .map(function(block) {

//             debug("c",block.constructor.name)

//             if (block.constructor.name === 'Craft') {
//                 // skip
//                 debug('craft')

//             } else if (block instanceof CraftRef) {
//                 debug('craftref')

//                 return scope[block.name].render(scope)
//                     // return block.render()
//             } else {

//                 return block.render(scope)
//             }
//         })
//         .compact(solids)
//         .value()

//     // console.log(solids)


//     // layout these solids
//     this.doLayout(solids)

//     // create a parent Solid to group these solids under
//     var solid = new Solid()
//     solid.children = solids
//     solid.fitToChildren()
//     return solid
// }

// function rowLayout(solids) {
//     var tx = 0
//     solids.forEach(function(solid) {
//         solid.layout.x = tx
//         tx = tx + solid.layout.width
//     })
// }

// function stackLayout(solids) {
//     var tz = 0
//     solids.forEach(function(solid) {
//         solid.layout.z = tz
//         tz = tz + solid.layout.depth
//     })
// }