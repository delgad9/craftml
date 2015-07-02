import Location from './location'
import Size from './size'
import $$$ from './scad'

var CSG = $$$.CSG,
    G = require('./scad/geometry')

function box(l,s) {
    var c = {x:l.x+s.x/2,y:l.y+s.y/2,z:l.z+s.z/2}
    var r = {x:s.x/2,y:s.y/2,z:s.z/2}
    var result = CSG.fromPolygons([
        [0, 2, 3, 1],
        [4, 5, 7, 6]
    ].map(info => {
        var vertices = info.map(i => {
            var pos = new G.Vector3D(
                c.x + r.x * (2 * !!(i & 1) - 1), c.y + r.y * (2 * !!(i & 2) - 1), c.z + r.z * (2 * !!(i & 4) - 1));
            return new G.Vertex(pos)
        });
        return new G.Polygon(vertices, null)
    }));
    return result;
}

//
// Box models a 3D region that encloses a solid. Its main use is to
// represent how much a solid might occupy in a 3D space, information
// that can be used by a layout operation (e.g., stack).
//
export default class Box{

    constructor(){
        if (arguments.length === 2){
            let s = arguments[1]
            let o = arguments[0]
            this.c = box(o,s)
            let b = this.c.getBounds()
            this.location = new Location(b[0].x,b[0].y,b[0].z)
            this.size = new Size(b[1].x-b[0].x,b[1].y-b[0].y,b[1].z-b[0].z)
        } else {
            this.size = new Size(0,0,0)
            this.location = new Location(0,0,0)
        }
    }

    clone(){
        let copy = new Box()
        copy.c = this.c
        copy.size = this.size
        copy.location = this.location
        return copy
    }

    transformTo(location, size){
        this.c = box(location, size)
        let b = this.c.getBounds()
        this.location = location
        this.size = size
    }

    transform(m){
        this.c = this.c.transform(m)
        let b = this.c.getBounds()
        this.location = new Location(b[0].x,b[0].y,b[0].z)
        this.size = new Size(b[1].x-b[0].x,b[1].y-b[0].y,b[1].z-b[0].z)
    }
}
