var Location = require('./location'),
    Size = require('./size'),
    $$$ = require('./scad')

//
// Box models a 3D region that encloses a solid. Its main use is to
// represent how much a solid might occupy in a 3D space, information
// that can be used by a layout operation (e.g., stack).
//
function Box(){
    if (arguments.length === 2){
        var s = arguments[1]
        var o = arguments[0]
        this.size = s
        this.location = o
        this.c = $$$.cube([s.x,s.y,s.z]).translate([o.x,o.y,o.z])
    } else {
        this.size = new Size(0,0,0)
        this.location = new Location(0,0,0)
    }
}

Box.prototype.clone = function(){
    var s = this.size
    var o = this.location
    var copy = new Box(new Location(o.x,o.y,o.z), new Size(s.x,s.y,s.z))
    copy.c = this.c
    return copy
}

// Box.prototype.translate = function(x,y,z){
//     this.location.x += x
//     this.location.y += y
//     this.location.z += z
// }
//
// Box.prototype.scale = function(x,y,z){
//     this.size.x *= x
//     this.size.y *= y
//     this.size.z *= z
// }

Box.prototype.transform = function(m){
    this.c = this.c.transform(m)

    var b = this.c.getBounds()
    this.location = new Location(b[0].x,b[0].y,b[0].z)
    this.size = new Size(b[1].x-b[0].x,b[1].y-b[0].y,b[1].z-b[0].z)
}

module.exports = Box
