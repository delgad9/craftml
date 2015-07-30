import Promise from 'bluebird'
import _ from 'lodash'
import G from '../../scad/geometry'
import CAG from '../../scad/cag'
import CSG from '../../scad/csg'
import Solid from '../../solid'
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
    return triangle_polygons
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



function isFlippingNecessary(first, last, shapes){

    let first_polygons = _.get(first,'csg.polygons') || []
    let last_polygons = _.get(last, 'csg.polygons') || []

    if (first_polygons.length > 0 && !first_polygons[0].isConvex()){
        first_polygons = _convert_to_triangles(first)
    }
    if (last_polygons.length > 0 && !last_polygons[0].isConvex()){
        last_polygons = _convert_to_triangles(last)
    }

    let d
    if (first_polygons.length > 0 && last_polygons.length > 0){

        // d = computeDirection(first_polygons[0], last_polygons[0])

        d = first_polygons[0].plane.signedDistanceToPoint(last_polygons[0].vertices[0].pos)

    } else if (first.role == '1d' && last_polygons.length > 0){

        console.log('first point last polygon')

        let pos = new G.Vector3D(first.layout.position.x, first.layout.position.y, first.layout.position.z)
        d = - last_polygons[0].plane.signedDistanceToPoint(pos)

    } else if (last.role == '1d' && first_polygons.length > 0) {

        console.log('last point first polygon')

        let pos = new G.Vector3D(last.layout.position.x, last.layout.position.y, last.layout.position.z)
        d = first_polygons[0].plane.signedDistanceToPoint(pos)

    } else {

        let polygonShape = _.find(shapes, s => {
            return _.has(s, 'csg.polygons[0]')
        })
        let pos = new G.Vector3D(first.layout.position.x, first.layout.position.y, first.layout.position.z)
        d = - polygonShape.csg.polygons[0].plane.signedDistanceToPoint(pos)
    }

    return d > 0
}

function computeDirection(poly1, poly2){
    return poly1.plane.signedDistanceToPoint(poly2.vertices[0].pos) > 0
}

export default function solid_from_slices(solids){

        let shapes = solids

        let first = _.first(shapes)
        let last = _.last(shapes)

        // console.log(_.pluck(shapes, 'csg'))


        let loop = false
        if (_.all(shapes, s => {
            return _.has(s, 'csg')
        })){
            let directionFirstLast = computeDirection(first.csg.polygons[0], last.csg.polygons[0])
            let directionFirstSecond = computeDirection(first.csg.polygons[0], shapes[1].csg.polygons[0])

            console.log('dir', directionFirstLast, directionFirstSecond)

            loop = directionFirstLast != directionFirstSecond

        } else {

            loop = false

        }

        let needsFlipping = isFlippingNecessary(first, last, shapes) || loop
        //console.log('needsFlipping:', needsFlipping)

        // build walls between every consecutive pair of 2D shapes
        let walls =
            _(_.zip(_.initial(shapes), _.rest(shapes)))
            // every consecutive pair of 2D shapes
            .map(pair => {

                // take the first polygon (assuming each 2D shape is
                // made up of a single polygon
                if (_.all(_.pluck(pair, 'csg.polygons[0]'))){

                    let [polygonA, polygonB] = _.pluck(pair, 'csg.polygons[0]')

                //console.log(polygonA.polygons.length)
                    return build_walls_between_polygons(polygonA, polygonB, needsFlipping)

                } else {

                    let polygon, point, flipped
                    if (pair[0].csg){
                        polygon = pair[0].csg.polygons[0]
                        point = pair[1]
                        flipped = needsFlipping
                    } else {
                        polygon = pair[1].csg.polygons[0]
                        point = pair[0]
                        flipped = !needsFlipping
                    }

                    // console.log(point.layout)
                    let p = point.layout.position
                    return build_walls_between_polygon_and_point(polygon, p.x, p.y, p.z, flipped)
                }

            })
            .flatten()
            .value()


        let open = true

        // OPEN
        if (!loop){
            function flip(polygons){
                return _.map(polygons, p => {return p.flipped()})
            }

            let first_polygons = _.get(first,'csg.polygons') || []
            let last_polygons = _.get(last, 'csg.polygons') || []


            if (first_polygons.length > 0 && !first_polygons[0].isConvex()){
                first_polygons = _convert_to_triangles(first)
            }
            if (last_polygons.length > 0 && !last_polygons[0].isConvex()){
                last_polygons = _convert_to_triangles(last)
            }
            // build the first side and the last side

            if (needsFlipping){
                first_polygons = flip(first_polygons)
            } else {
                last_polygons = flip(last_polygons)
            }

            let all_polygons = []
            all_polygons = all_polygons.concat(first_polygons)
            all_polygons = all_polygons.concat(last_polygons)
            all_polygons = all_polygons.concat(walls)

            let csg = new CSG.fromPolygons(all_polygons)
            return csg

        } else {

            let [firstPolygon, lastPolygon] = _.pluck([first,last], 'csg.polygons[0]')
            let lastWalls = build_walls_between_polygons(lastPolygon, firstPolygon, needsFlipping)

            let all_polygons = []
            all_polygons = all_polygons.concat(walls)
            all_polygons = all_polygons.concat(lastWalls)

            let csg = new CSG.fromPolygons(all_polygons)
            return csg

        }
}


function build_walls_between_polygon_and_point(polygon, x, y, z, flipped) {

    var polygonPoints = polygon.vertices.slice(0) //make a copy

    var getTriangle = function addWallsPutTriangle(pointA, pointB, pointC) {
        if (flipped)
            return new G.Polygon([pointA, pointB, pointC])
        else
            return new G.Polygon([pointB, pointA, pointC])
    }

    let vertex = new G.Vertex(new G.Vector3D(x,y,z))

    let walls = []
    let pairs = _.zip(_.initial(polygonPoints), _.rest(polygonPoints))

    _.forEach(pairs, pp => {
        let wall = getTriangle(pp[0], pp[1], vertex)
        walls.push(wall)
    })

    //console.log('walls constructed', walls.length)
    return walls
}

function build_walls_between_polygons(top, bottom, needsFlipping){

    var bottomPoints = bottom.vertices.slice(0), //make a copy
        topPoints = top.vertices.slice(0), //make a copy
        color = top.shared || null;

    var iTopLen = topPoints.length - 1,
        iBotLen = bottomPoints.length - 1

    let flipped = bottom.plane.signedDistanceToPoint(top.vertices[0].pos) < 0
    if (flipped){
        // bottomPoints = bottomPoints.reverse()
        // topPoints = topPoints.reverse()
    }

    var getTriangle = function addWallsPutTriangle(pointA, pointB, pointC, color) {
        if (needsFlipping){
            return new G.Polygon([pointB, pointA, pointC], color);
        } else {
            return new G.Polygon([pointA, pointB, pointC], color);
        }
    };

    var bpoint = bottomPoints[0],
        tpoint = topPoints[0],
        secondPoint

    //console.log(top.vertices.length, topPoints.length)
    //console.log(bottom.vertices.length, bottomPoints.length)

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
            // ignore this wall
        }

        alt = !alt
    }
    return walls;
}
