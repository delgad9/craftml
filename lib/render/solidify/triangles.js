import earcut from 'earcut'
import _ from 'lodash'
import G from '../../scad/geometry'

//
//  take a solid with a csg that has a single non-convex polygon
//
//  return the same Solid where the non-convex polygon is split into a
//   list of triangular polygons
//
function _convert_to_triangles(csg){

    let polygon = solid.csg.polygons[0]

    let triangle_polygons = split(polygon)
    return triangle_polygons
    // let csg = new CSG.fromPolygons(triangle_polygons)
    //
    // solid.csg = csg

    // return solid
}

//
// return [Polygon]
//
export function split(polygon){

    let ps = _.map(polygon.vertices, vertex => {
        return [vertex.pos._x, vertex.pos._y]
    })
    ps = _.flatten(ps)

    let triangles = earcut(ps)

    let trianglePolygons = []

    _.forEach(_.chunk(triangles, 3), chunk => {

            let triangleVertices = _.at(polygon.vertices, chunk)

            // console.log(triangleVertices)

            let trianglePolygon = new G.Polygon(triangleVertices)

            trianglePolygons.push(trianglePolygon)
    })

    return trianglePolygons
}
