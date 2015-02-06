'strict'

var Element = require('./element'),
    layout = require('./layout')

module.exports = Group

function Group() {
    Element.apply(this)
}

Group.prototype = new Element()
Group.prototype.constructor = Group

// Group defaults to absolute layout
Group.prototype.doLayout = layout.absolute

// function(solids, solid) {
//     // do layout
//     // var tx = 0
//     console.log('Plane')
//     solids.forEach(function(solid, i) {
//         console.log("   no.%d", i)
//         console.log("   ", solid.layout)
//     })

//     // solid.layout.x = 0
//     // solid.layout.y = 0
//     // solid.layout.height = 20
//     // solid.layout.depth = 5


//     var xrange = {}
//     var yrange = {}
//     var zrange = {}
//     xrange.min = _.min(solids.map(function(c) {
//         return c.layout.location.x
//     }))
//     xrange.max = _.max(solids.map(function(c) {
//         return c.layout.location.x + c.layout.size.x
//     }))
//     yrange.min = _.min(solids.map(function(c) {
//         return c.layout.location.y
//     }))
//     yrange.max = _.max(solids.map(function(c) {
//         return c.layout.location.y + c.layout.size.y
//     }))
//     zrange.min = _.min(solids.map(function(c) {
//         return c.layout.location.z
//     }))
//     zrange.max = _.max(solids.map(function(c) {
//         return c.layout.location.z + c.layout.size.z
//     }))

//     // solid.layout.height = yrange.max
//     // solid.layout.width = xrange.max
//     // solid.layout.depth = zrange.max

//     // solid.layout.x = 0
//     // solid.layout.y = 0
//     // solid.layout.z = 0

//     // solid.layout.size = {
//     //     x: xrange.max - xrange.min,
//     //     y: yrange.max - yrange.min,
//     //     z: zrange.max - zrange.min
//     // }

//     solid.layout.size = {
//         x: xrange.max,
//         y: yrange.max,
//         z: zrange.max
//     }
//     solid.layout.location = {
//         x: 0,
//         y: 0,
//         z: 0
//     }

//     // solids.forEach(function(solid, i) {
//     //     solid.layout.location.x = solid.layout.location.x - xrange.min
//     //     solid.layout.location.y = solid.layout.location.y - yrange.min
//     //     solid.layout.location.z = solid.layout.location.z - zrange.min
//     //     console.log("   >", solid.layout)
//     // })


//     console.log('   solid ', solid.layout)
//     console.log('/Plane')

//     // solid.layout.size = {
//     //     x: xrange.max - xrange.min,
//     //     y: yrange.max - yrange.min,
//     //     z: zrange.max - zrange.min
//     // }
// }