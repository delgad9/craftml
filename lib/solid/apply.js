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

function _applyTranformation(solid, matrix, flipped) {

    matrix = matrix || Matrix4x4.unity()

    solid.layout.transform(matrix)

    matrix = solid.m.multiply(matrix)

    if (solid.csg){

        // compute convexity and save it for furture uses
        // (after transform, convex() computation is broken for some unknown reason)

        let isConvex = solid.csg.polygons[0].isConvex()
        solid.csg.polygons[0].convex = isConvex

        // do the transform
        let isUnity = _.isEqual(matrix.elements, Matrix4x4.unity().elements)
        if (!isUnity){
            if (solid.csg.polygons.length < 50000){

                solid.csg = solid.csg.transform(matrix)

                // HACK!!
                solid.csg.polygons[0].convex = isConvex

                solid.flipped = false
                solid.m = Matrix4x4.unity()

                // solid.fitToCSG()

                // console.log('applying')

            } else {

                console.log('skipping')

                solid.m = matrix
            }
        }

    } else {

        // solid.layout.transform(matrix)
        solid.flipped = false
        solid.m = Matrix4x4.unity()

    }

    solid.children.forEach(function(c) {
        _applyTranformation(c, matrix, flipped)
    })

    // solid.fitToChildren()
}
