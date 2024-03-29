import $$$ from '../scad'
var CSG = $$$.CSG

import {Vector3D, Polygon, Vertex, Position, Size} from './index.js'

function box(l,s) {
    var c = {x:l.x+s.x/2,y:l.y+s.y/2,z:l.z+s.z/2}
    var r = {x:s.x/2,y:s.y/2,z:s.z/2}
    var result = CSG.fromPolygons([
        [0, 2, 3, 1],
        [4, 5, 7, 6]
    ].map(info => {
        var vertices = info.map(i => {
            var pos = new Vector3D(
                c.x + r.x * (2 * !!(i & 1) - 1), c.y + r.y * (2 * !!(i & 2) - 1), c.z + r.z * (2 * !!(i & 4) - 1));
            return new Vertex(pos)
        });
        return new Polygon(vertices, null)
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
            this.position = new Position(b[0].x,b[0].y,b[0].z)
            this.size = new Size(b[1].x-b[0].x,b[1].y-b[0].y,b[1].z-b[0].z)
        } else {
            this.c = box(new Position(0,0,0),new Size(0,0,0))
            this.size = new Size(0,0,0)
            this.position = new Position(0,0,0)
        }
    }

    clone(){
        let copy = new Box()
        copy.c = this.c
        copy.size = this.size
        copy.position = this.position
        return copy
    }

    transformTo(position, size){
        this.c = box(position, size)
        let b = this.c.getBounds()
        this.position = position
        this.size = size
    }

    transform(m){
        if (this.c){
            this.c = this.c.transform(m)
            let b = this.c.getBounds()
            this.position = new Position(b[0].x,b[0].y,b[0].z)
            this.size = new Size(b[1].x-b[0].x,b[1].y-b[0].y,b[1].z-b[0].z)
        }
    }
}
