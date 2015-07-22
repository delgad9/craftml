import _ from 'lodash'
import Matrix4x4 from '../scad/geometry/Matrix4x4'


export default function apply() {
    _applyTranformation(this, null, false)
}

import Plane from '../scad/geometry/Plane'
import Vector3D from '../scad/geometry/Vector3D'
import Vertex from '../scad/geometry/Vertex'
import Polygon from '../scad/geometry/Polygon'
import CSG from '../scad/csg'

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

function _applyCropRecursively(solid, box){

    // console.log('apply crop', solid, box)

    if (solid.csg){

        if (solid.csg.polygons.length < 1000){

            solid.csg = _applyCrop(solid.csg, box)
            solid.fitToCSG()

        } else {

            let cube = createCubeFromBox(box)
            let proxy = createCubeFromBox(solid.layout)
            let result = proxy.intersect(cube)
            let saved = solid.csg
            solid.csg = result
            solid.fitToCSG()
            solid.csg = saved
        }

    } else {

        // solid.csg = box.c
        // solid.fitToCSG()

    }

    _.forEach(solid.children, c => {

        _applyCropRecursively(c, box)

        // solid.fitToChildren()

    })

    solid.fitToChildren()
}

// function compileRecursively(solid, matrix, flipped){
//     matrix = matrix || Matrix4x4.unity()
//
//     solid.layout.transform(matrix)
//
//     matrix = solid.m.multiply(matrix)
//
//     if (solid.csg){
//
//         // do the transform
//         let isUnity = _.isEqual(matrix.elements, Matrix4x4.unity().elements)
//         if (!isUnity){
//             if (solid.csg.polygons.length < 1000){
//
//                 solid.csg = solid.csg.transform(matrix)
//                 solid.flipped = false
//                 solid.m = Matrix4x4.unity()
//
//             } else {
//                 solid.m = matrix
//             }
//         }
//
//     } else {
//         solid.flipped = false
//         solid.m = Matrix4x4.unity()
//     }
//
//     _.forEach(solid.children, c => {
//         compileRecursively(c, matrix, flipped)
//     })
// }

function _applyTranformation(solid, matrix, flipped) {

    matrix = matrix || Matrix4x4.unity()

    solid.layout.transform(matrix)

    matrix = solid.m.multiply(matrix)

    if (solid.csg){

        // do the transform
        let isUnity = _.isEqual(matrix.elements, Matrix4x4.unity().elements)
        if (!isUnity){
            if (solid.csg.polygons.length < 1000){

                solid.csg = solid.csg.transform(matrix)


                solid.flipped = false
                solid.m = Matrix4x4.unity()

            } else {

                // solid.m = Matrix4x4.unity()
                solid.m = matrix
            }
        }

        // solid.m = Matrix4x4.unity()

    } else {

        // solid.layout.transform(matrix)
        solid.flipped = false
        solid.m = Matrix4x4.unity()

    }

    solid.children.forEach(function(c) {
        _applyTranformation(c, matrix, flipped)
    })
    //
    // if (solid.cropped) {
    //     _applyCropRecursively(solid, solid.layout)
    //     solid.cropped = false
    // }

}
