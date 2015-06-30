import Promise from 'bluebird'
import _ from 'lodash'
import parse  from 'svg-path-parser'
import G from '../scad/geometry'
import CAG from '../scad/cag'
import CSG from '../scad/csg'
import Solid from '../solid'
import earcut from 'earcut'

//
//  take a solid with a csg that has a single non-convex polygon
//
//  return the same Solid where the non-convex polygon is split into a
//   list of triangular polygons
//
function _convert_to_triangles(solid){

    let polygon = solid.csg.polygons[0]

    let triangle_polygons = __split_polygon_into_triangles_by_earcut(polygon)

    let csg = new CSG.fromPolygons(triangle_polygons)

    solid.csg = csg

    return solid
}

//
// return [Polygon]
//
function __split_polygon_into_triangles_by_earcut(polygon){

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


function solidify_solid_with_holes(solids){

    solids[0].apply()
    let shapes = select_2d_shapes(solids)

    if (shapes.length == 1){
        return linear_extrude_with_one_hole(_.first(shapes))
    }
}

// take a Solid, which is a shape, assuming there is only one hole
function linear_extrude_with_one_hole(solid){

    let [wholePolygon, holePolygon] = solid.csg.polygons

    let ps = _.map(wholePolygon.vertices, vertex => {
        return [vertex.pos._x, vertex.pos._y]
    })
    ps = _.flatten(ps)

    let n = ps.length

    let qs = _.map(holePolygon.vertices, vertex => {
        return [vertex.pos._x, vertex.pos._y]
    })
    qs = _.flatten(qs)

    let holeIndices = [ps.length/2]

    // ps = qs//ps.concat(qs)
    ps = ps.concat(qs)

    let allVertices = wholePolygon.vertices
        .concat(holePolygon.vertices)
    // console.log(allVertices)
    // console.log(holeIndices, ps, ps.length)

    let triangles = earcut(ps, holeIndices, 2)
    // console.log(triangles)
    //
    let trianglePolygons = []
    //
    _.forEach(_.chunk(triangles, 3), chunk => {

            let triangleVertices = _.at(allVertices, chunk)
            // let triangleVertices = _.at(holePolygon.vertices, chunk)

            // console.log(triangleVertices)

            let trianglePolygon = new G.Polygon(triangleVertices)

            trianglePolygons.push(trianglePolygon)
    })

    let oneSidePolygons = trianglePolygons

    let anotherSidePolygons = _.map(oneSidePolygons, poly => {
            return poly.translate([0,0,-10]).flipped()
    })

    let wholePolygon_offset = wholePolygon.translate([0,0,-10])
    let exteriorWalls = build_walls_between_polygons(wholePolygon, wholePolygon_offset)

    let holePolygon_offset = holePolygon.translate([0,0,-10])
    let holeWalls = build_walls_between_polygons(holePolygon, holePolygon_offset)
    holeWalls = _.map(holeWalls, poly => {
        return poly.flipped()
    })

    let allPolygons = _.flatten([oneSidePolygons, anotherSidePolygons, exteriorWalls, holeWalls])

    let csg = new CSG.fromPolygons(allPolygons)

    return [new Solid(csg)]
}

function solidify_solids(solids){

        solids[0].apply()

        let shapes = select_2d_shapes(solids)
        console.log('shapes', shapes)
        //
        let first = _.first(shapes)
        let last = _.last(shapes)

        // build walls between every consecutive pair of 2D shapes
        let walls =
            _(_.zip(_.initial(shapes), _.rest(shapes)))
            // every consecutive pair of 2D shapes
            .map(pair => {

                // take the first polygon (assuming each 2D shape is
                // made up of a single polygon
                let [polygonA, polygonB] = _.pluck(pair, 'csg.polygons[0]')

                return build_walls_between_polygons(polygonA, polygonB)

            })
            .flatten()
            .value()

        // build the first side and the last side
        _convert_to_triangles(first)
        _convert_to_triangles(last)

        // flipt the last side
        last.csg.polygons = _.map(last.csg.polygons, p => {return p.flipped()})

        //csg.polygons
        let all_polygons = []
        all_polygons = all_polygons.concat(first.csg.polygons)
        all_polygons = all_polygons.concat(last.csg.polygons)
        all_polygons = all_polygons.concat(walls)

        // all_polygons = _.at(all_polygons, [0,1,2,3,4,5,6,7])
        // console.log(all_polygons)
        let csg = new CSG.fromPolygons(all_polygons)

        return [new Solid(csg)]
}

export default function solidify(render, element, scope) {

    // var slices = select(scope.solids)//[0].children

    return render(element.children, scope)
        // .then(solidify_solids)
        .then(solidify_solid_with_holes)
}

function build_walls_between_polygons(top, bottom){

    var bottomPoints = bottom.vertices.slice(0), //make a copy
        topPoints = top.vertices.slice(0), //make a copy
        color = top.shared || null;

    var iTopLen = topPoints.length - 1,
        iBotLen = bottomPoints.length - 1

    var getTriangle = function addWallsPutTriangle(pointA, pointB, pointC, color) {
        // console.log(pointA.pos, pointB.pos, pointC.pos)
        return new G.Polygon([pointA, pointB, pointC], color);
    };

    var bpoint = bottomPoints[0],
        tpoint = topPoints[0],
        secondPoint

    var alt = true
    var walls = []
    for (var iB = 0, iT = 0, iMax = iTopLen + iBotLen; iB + iT < iMax;) {

        let wall

        if (alt){

            secondPoint = bottomPoints[++iB];
            wall = getTriangle(
                tpoint, bpoint, secondPoint, color
            )
            bpoint = secondPoint;

        } else {

            secondPoint = topPoints[++iT];
            wall = getTriangle(
                secondPoint, tpoint, bpoint, color
            )
            tpoint = secondPoint;
        }

        // if the wall has a valid plane is valid (i.e., the surface normal is a not NaN)
        if (!isNaN(wall.plane.w)){
            // add this wall
            walls.push(wall)
        } else {
            // the wall does not have a valid plane if two or more of the vertices coincide
        }

        alt = !alt
    }
    return walls;
}

function select_2d_shapes(solids){
    return _.flatten(_.map(solids, function(solid){
        var selected = []
        if (solid.csg && solid.csg.properties.type == 'lines'){
            selected.push(solid)
        }
        return selected.concat(select_2d_shapes(solid.children))
    }))
}
