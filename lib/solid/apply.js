import _ from 'lodash'
import Matrix4x4 from '../scad/geometry/Matrix4x4'


export default function apply() {
    _applyTranformation(this)
}

import Plane from '../scad/geometry/Plane'
import Vector3D from '../scad/geometry/Vector3D'
import Vertex from '../scad/geometry/Vertex'
import Polygon from '../scad/geometry/Polygon'
import CSG from '../scad/csg'

function _applyCrop(csg, box){
    let xyplane = new Plane(new Vector3D([0, 0, 1]), 1)
    // console.log('box',box)
    let x = box.location.x
    let y = box.location.y
    let z = box.location.z
    let dx = box.size.x
    let dy = box.size.y
    let dz = box.size.z

    let vertices = [];
    vertices.push(new Vertex(new Vector3D(x,y,z)))
    vertices.push(new Vertex(new Vector3D(x,y+dy,z)))
    vertices.push(new Vertex(new Vector3D(x+dx,y+dy,z)))
    vertices.push(new Vertex(new Vector3D(x+dx,y,z)))

    //
    let polygon = new Polygon(vertices)//, xyplane.flipped())
    // console.log(polygon)

    // and extrude the polygon into a cube, backwards of the plane:
    let cube = polygon.extrude(xyplane.normal.times(dz))

    let bs = csg.getBounds()
    vertices = [];
    // z = bs[0].z
    x,y,z = bs[0].x, bs[0].y, bs[0].z
    dz = bs[1].z - bs[0].z
    let {x:x1,y:y1,z:z1} = bs[1]
    // console.log(x1,y1,z1)
    vertices.push(new Vertex(new Vector3D(x,y,z)))
    vertices.push(new Vertex(new Vector3D(x,y1,z)))
    vertices.push(new Vertex(new Vector3D(x1,y1,z)))
    vertices.push(new Vertex(new Vector3D(x1,y,z)))
    let boundingCube = (new Polygon(vertices)).extrude(xyplane.normal.times(dz))

    // let cube = CSG.cube()
        // .translate([1,-1,1])
        // .scale([dx/2,dy/2,dz/2])
        // .translate([x,y,z])
    //
    // let result = csg.subtract(cube.inverse())
    //console.log(_.pluck(csg.polygons, 'plane.normal'))
    let result = csg.intersect(cube)

    // let result = CSG.fromPolygons([polygon])
    // let result = cube
    result.properties = csg.properties; // keep original properties
    // console.log(result)
    // if (csg.polygons.length < 200){
    return csg//result///boundingCube.intersect(cube)
    // } else {
        // return CSG.cube()
    // }
}

function _applyCropRecursively(solid, box){

    // console.log('apply crop', solid, box)

    if (solid.csg){

        solid.csg = _applyCrop(solid.csg, box)
        solid.fitToCSG()

    }

    _.forEach(solid.children, c => {

        _applyCropRecursively(c, box)

    })

}

function _applyTranformation(node, matrix) {

    if (_.isArray(node)) {

        node.forEach(function(x) {
            _applyTranformation(x)
        })

    } else {

        var solid = node

        var m = matrix || Matrix4x4.unity()

        if (solid.m) {
            m = solid.m.multiply(m)
            solid.m = Matrix4x4.unity()
        }

        if (solid.csg && solid.m) {
            // do the transform
            solid.csg = solid.csg.transform(m)
            // console.log(solid.csg.getBounds(), solid.layout)
            // check if the solid has ever been cropped

            if (solid.cropped){

                solid.layout.transform(matrix || Matrix4x4.unity())
                solid.csg = _applyCrop(solid.csg, solid.layout)
                solid.fitToCSG()

            } else {
            // let bs = solid.csg.getBounds()

                if (solid.color){
                    solid.csg.color = solid.color
                }
                solid.fitToCSG()
            }
            // solid.showTransforms()
        }

        if (solid.children && solid.children.length > 0) {

            solid.children.forEach(function(c) {

                // pass color to child (when the child's color is undefined)
                if (solid.color && c.color === undefined){
                    c.color = solid.color
                }

                _applyTranformation(c, m)
            })


            // TODO: cropping
            if (solid.cropped) {
                // console.log('here')
                // solid.layout.crop.csg = solid.layout.crop.csg.transform(m)
                solid.layout.transform(matrix || Matrix4x4.unity())
                // solid.layout.transform(m)//atrix || Matrix4x4.unity())
                _applyCropRecursively(solid, solid.layout)
            }

            // solid.fitToChildren()


        }
    }
}
