const MAX_POLYGONS_TO_CROP = 1000

import _ from 'lodash'
import Plane from '../../scad/geometry/Plane'
import Vector3D from '../../scad/geometry/Vector3D'
import Vertex from '../../scad/geometry/Vertex'
import Polygon from '../../scad/geometry/Polygon'
import CSG from '../../scad/csg'

import Position from '../../position'

export function crop(dim, amount1 = 0, amount2 = 0){

    if (amount1.type == 'percentage'){
        amount1 = amount1.value * this.size[dim] / 100
    }

    if (amount2.type == 'percentage'){
        amount2 = amount2.value * this.size[dim] / 100
    }

    _crop_helper.call(this, dim, amount1, 'min')
    _crop_helper.call(this, dim, amount2, 'max')

    this.apply()
    _applyCropRecursively(this, this.layout)
}


function _crop_helper(dim, amount, from = 'min'){

    if (amount <= 0){
        return
    }

    let d = {
        x:0,
        y:0,
        z:0
    }

    let s = _.clone(this.size)
    s[dim] = this.size[dim] - amount

    // calculate where to move the bounding box in order to match the remaining,
    // uncropped portion
    let l = _.clone(this.position)
    if (from == 'min'){
        l[dim] = l[dim] + amount
    }

    this.layout.transformTo(l, s)
}



function _applyCrop(csg, box){

    // and extrude the polygon into a cube, backwards of the plane:
    let cube = createCubeFromBox(box)//polygon.extrude(xyplane.normal.times(dz))
    let result = csg.intersect(cube)
    result.properties = csg.properties // keep original properties
    return result
}

function createCubeFromBox(box){
    let xyplane = new Plane(new Vector3D([0, 0, 1]), 1)
    let x = box.position.x
    let y = box.position.y
    let z = box.position.z
    let dx = box.size.x
    let dy = box.size.y
    let dz = box.size.z

    let vertices = [];
    vertices.push(new Vertex(new Vector3D(x,y,z)))
    vertices.push(new Vertex(new Vector3D(x,y+dy,z)))
    vertices.push(new Vertex(new Vector3D(x+dx,y+dy,z)))
    vertices.push(new Vertex(new Vector3D(x+dx,y,z)))

    let polygon = new Polygon(vertices)
    // console.log(polygon)

    // and extrude the polygon into a cube, backwards of the plane:
    let cube = polygon.extrude(xyplane.normal.times(dz))
    return cube
}

//
// check if a vertex is inside a box
//
function boundCheck(box){

    let b0 = {}, b1 = {}
    _.forEach(['x','y','z'], dim => {
        b0[dim] = box.position[dim]
        b1[dim] = box.position[dim] + box.size[dim]
    })

    return function(v){
        return v.pos.x >= b0.x && v.pos.y >= b0.y && v.pos.z >= b0.z &&
            v.pos.x <= b1.x && v.pos.y <= b1.y && v.pos.z <= b1.z
    }
}

class BoundFinder {

    constructor() {
        this.b0 = {}
        this.b1 = {}
        _.forEach(['x','y','z'], dim => {
            this.b0[dim] = Infinity
            this.b1[dim] = -Infinity
        })
    }

    update(v) {
        _.forEach(['x','y','z'], dim => {
            this.b0[dim] = Math.min(this.b0[dim], v.pos[dim])
            this.b1[dim] = Math.max(this.b1[dim], v.pos[dim])
        })
    }

    get(){
        return [this.b0, this.b1]
    }
}

function _applyCropRecursively(solid, box){

    if (solid.csg){

        if (solid.csg.polygons.length < 1000){

            solid.csg = _applyCrop(solid.csg, box)
            solid.fitToCSG()

        } else {

            let matrix = solid.m

            console.time('cropping')
            let i = 0
            let indices = []

            let inside = boundCheck(box)
            let bf = new BoundFinder()

            let insidePolygons = []

            _.forEach(solid.csg.polygons, (p,i) =>{

                let vs = _.map(p.vertices, v => {
                    return v.transform(matrix)
                })

                if (_.all(vs, inside)){

                    indices.push(i)

                    _.forEach(vs, bf.update, bf)

                    insidePolygons.push(p)
                }
            })

            solid.csg = CSG.fromPolygons(insidePolygons)
            console.timeEnd('cropping')

            let bs = bf.get()
            let pos = new Position(bs[0].x,bs[0].y,bs[0].z)
            let size = new Position(bs[1].x-bs[0].x,bs[1].y-bs[0].y,bs[1].z-bs[0].z)
            solid.layout.transformTo(pos,size)
        }

    }

    _.forEach(solid.children, c => {
        _applyCropRecursively(c, box)
    })

    solid.fitToChildren()
}
