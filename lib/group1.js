var _ = require('lodash')

module.exports = Group

function Group() {
    this.type = 'group'
    this.children = []
    this.layout = {
        location: {
            x: 0,
            y: 0,
            z: 0
        },
        size: {
            x: 0,
            y: 0,
            z: 0
        }
    }
}

Group.prototype.fitToChildren = function() {

    if (this.children) {
        // var size = computeSize(this.children)
        // this.layout.size = size

        var xrange = {}
        var yrange = {}
        var zrange = {}
        xrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.x
        }))
        xrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.x + c.layout.size.x
        }))
        yrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.y
        }))
        yrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.y + c.layout.size.y
        }))
        zrange.min = _.min(this.children.map(function(c) {
            return c.layout.location.z
        }))
        zrange.max = _.max(this.children.map(function(c) {
            return c.layout.location.z + c.layout.size.z
        }))

        this.layout.size = {
            x: xrange.max - xrange.min,
            y: yrange.max - yrange.min,
            z: zrange.max - zrange.min
        }

        this.layout.location = {
            x: xrange.min,
            y: yrange.min,
            z: zrange.min
        }


        this.children.forEach(function(c) {
            c.layout.location.x = c.layout.location.x - xrange.min
            c.layout.location.y = c.layout.location.y - yrange.min
            c.layout.location.z = c.layout.location.z - zrange.min
        })

        // this.layout.location = {
        //     x: 0,
        //     y: 0,
        //     z: 0
        // }
    }
}

// function computeSize(children) {
//     var xrange = {}
//     var yrange = {}
//     var zrange = {}
//     xrange.min = _.min(children.map(function(c) {
//         return c.layout.location.x
//     }))
//     xrange.max = _.max(children.map(function(c) {
//         return c.layout.location.x + c.layout.size.x
//     }))
//     yrange.min = _.min(children.map(function(c) {
//         return c.layout.location.y
//     }))
//     yrange.max = _.max(children.map(function(c) {
//         return c.layout.location.y + c.layout.size.y
//     }))
//     zrange.min = _.min(children.map(function(c) {
//         return c.layout.location.z
//     }))
//     zrange.max = _.max(children.map(function(c) {
//         return c.layout.location.z + c.layout.size.z
//     }))

//     return {
//         x: xrange.max - xrange.min,
//         y: yrange.max - yrange.min,
//         z: zrange.max - zrange.min
//     }
// }