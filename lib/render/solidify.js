import Promise from 'bluebird'
import _ from 'lodash'
import parse  from 'svg-path-parser'
import G from '../scad/geometry'
import CAG from '../scad/cag'
import CSG from '../scad/csg'
import Solid from '../solid'
import earcut from 'earcut'

import {
    render, renderElementList
}
from './render'

export default function solidify($solid, $element, $scope) {

    return renderElementList($element.children, $scope)
        .then(() => {
            let solidified = solidify_solids($solid)

            $solid.removeAll()
            $solid.add(solidified)
            $solid.fitToChildren()
            solidified.computeStyle($scope.css)
        })
}

// take the first two solids
// take the first three vertices to calculate normals
// check if the two normals are the same
function isCoplaner(solids){

    let planes = _.map(_.take(solids,2), s => {
        let [a,b,c] = _.pluck(_.slice(s.csg.polygons[0].vertices, 0, 3), 'pos')
        return G.Plane.fromVector3Ds(a,b,c)
    })

    //console.log('how many', solids.length)

    // console.log('planes', planes)
    let [p1,p2] = planes
    return p1.equals(p2)
}

function solidify_solids(solid){

    solid.apply()

    // console.log(solids)
    let shapes = select_2d_shapes([solid])
    //console.log('selected', _.pluck(shapes, 'role'))

    if (shapes.length == 1){

        return linear_extrude_with_multiple_holes(_.first(shapes))

    } else if (shapes.length > 1){

        if (_.some(shapes, s => {
            return s.role == '1d'
        })){

            let csg = solid_from_slices(shapes)
            let solidified = new Solid(csg)
            solidified.name = 'csg'
            solidified.role = 'csg'
            return solidified

        } else if(isCoplaner(shapes)){

            let all_polygons = _.flatten(_.pluck(shapes, 'csg.polygons'))

            return linear_extrude_polygon_list(all_polygons)

        } else {

            let csg = solid_from_slices(shapes)
            let solidified = new Solid(csg)
            solidified.name = 'csg'
            solidified.role = 'csg'
            return solidified
        }
    }
}

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
    // let csg = new CSG.fromPolygons(triangle_polygons)
    //
    // solid.csg = csg

    // return solid
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




// does poly1 contain poly2?
function contains(poly1, poly2) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    var point = poly2.vertices[0].pos
    var x = point._x, y = point._y;
    var vs = _.pluck(poly1.vertices, 'pos')

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i]._x, yi = vs[i]._y;
        var xj = vs[j]._x, yj = vs[j]._y;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    // console.log('[inside]', point,x,y,vs,inside)

    return inside;
}

function annotate(polygons){
    // console.log('insideout input', polygons)

    let o = {
        children: []
    }

    _.forEach(polygons, poly => {
        insert(o, poly)
    })


    function mark(o, inside = false){
        if (o.poly){
            o.poly.inside = inside
            o.poly.children = _.pluck(o.children, 'poly')
        }
        _.forEach(o.children, c => mark(c, !inside))
    }

    mark(o)
    return _.partition(polygons, 'inside')
}

function insert(o, poly){

    let oc = _.find(o.children, c => {
        return contains(c.poly, poly)
    })

    if (oc){

        insert(oc, poly)

    } else {

        let [children, peers] = _.partition(o.children, c => {
            return contains(poly, c.poly)
        })

            let p = {poly, children}
            o.children = peers.concat(p)
    }
}

function linear_extrude_with_multiple_holes(solid){
    return linear_extrude_polygon_list(solid.csg.polygons)
}

//
function linear_extrude_polygon_list(polygons){

    annotate(polygons)

    let insidePolygons = _.filter(polygons, 'inside')

    // _.forEach(insidePolygons,
    let solids = _.map(insidePolygons, linear_extrude_polygon)
    let extrudedSolid = Solid.fromGroup(solids)
    extrudedSolid.role = 'group'
    extrudedSolid.name = 'g'
    extrudedSolid.translate(0,0,1)
    return extrudedSolid
}

// wholePolygon
// => must be annotated already
//
function linear_extrude_polygon(wholePolygon){

    let holePolygons = wholePolygon.children

    let ps = []
    _.forEach(wholePolygon.vertices, vertex => {
        ps.push(vertex.pos._x)
        ps.push(vertex.pos._y)
    })

    let n = ps.length

    let allVertices = _.clone(wholePolygon.vertices)

    let holeIndices = []

    _.forEach(holePolygons, poly => {

        let holeIndex = ps.length/2
        holeIndices.push(holeIndex)

        _.forEach(poly.vertices, vertex => {

            allVertices.push(vertex)

            ps.push(vertex.pos._x)
            ps.push(vertex.pos._y)
        })

    })

    let triangles = earcut(ps, holeIndices, 2)
    // console.log('tris', triangles, n, ps.length, holeIndices)

    let trianglePolygons = []
    _.forEach(_.chunk(triangles, 3), chunk => {

            let triangleVertices = _.at(allVertices, chunk)
            let trianglePolygon = new G.Polygon(triangleVertices)
            trianglePolygons.push(trianglePolygon)
    })

    let oneSidePolygons = trianglePolygons
    let anotherSidePolygons = _.map(oneSidePolygons, poly => {
            return poly.translate([0,0,-1]).flipped()
    })

    let wholePolygon_offset = wholePolygon.translate([0,0,-1])
    let exteriorWalls = build_walls_between_polygons(wholePolygon, wholePolygon_offset)


    let holeWalls = []
    _.forEach(holePolygons, holePolygon => {
        let holePolygon_offset = holePolygon.translate([0,0,-1])
        holeWalls = holeWalls.concat(build_walls_between_polygons(holePolygon, holePolygon_offset))
    })

    holeWalls = _.map(holeWalls, poly => {
        return poly.flipped()
    })

    let allPolygons = _.flatten([oneSidePolygons, anotherSidePolygons, exteriorWalls, holeWalls])

    let csg = new CSG.fromPolygons(allPolygons)
    let solid = new Solid(csg)
    solid.role = 'csg'
    solid.name = 'csg'
    return solid
}

function isFlippingNecessary(first, last, shapes){

    let first_polygons = _.get(first,'csg.polygons') || []
    let last_polygons = _.get(last, 'csg.polygons') || []

    let d
    if (first_polygons.length > 0 && last_polygons.length > 0){

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

function solid_from_slices(solids){

        let shapes = solids

        let first = _.first(shapes)
        let last = _.last(shapes)

        console.log(_.pluck(shapes, 'size.x'))

        let needsFlipping = isFlippingNecessary(first, last, shapes)

        console.log('needsFlipping:', needsFlipping)

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

        //
        // let d = first.csg.polygons[0].plane.signedDistanceToPoint(last.csg.polygons[0].vertices[0].pos)
        // let flipped = d < 0
        // console.log(d, flipped)
        function flip(polygons){
            // flipt the last side
            return _.map(polygons, p => {return p.flipped()})
        }

        // console.log('before', first.csg.polygons.length, last.csg.polygons.length)


        // console.log('convex?', first.csg.polygons[0].isConvex())

        let first_polygons = _.get(first,'csg.polygons') || []
        let last_polygons = _.get(last, 'csg.polygons') || []

        // console.log('before' ,first_polygons.length, last_polygons.length)
        // console.log('convex?', first_polygons[0].isConvex())
        // console.log('convex?', last_polygons[0].isConvex())
        // console.log('first', first_polygons[0].vertices)

        if (first_polygons.length > 0 && !first_polygons[0].isConvex()){
            first_polygons = _convert_to_triangles(first)
        }
        if (last_polygons.length > 0 && !last_polygons[0].isConvex()){
            last_polygons = _convert_to_triangles(last)
        }
        // build the first side and the last side

        // _convert_to_triangles(last)

        // console.log('after', first.csg.polygons.length, last.csg.polygons.length)
        // console.log('after' ,first_polygons.length, last_polygons.length)
        // // console.log()


        // let flipped = d < 0
        // console.log('after', d, flipped)
        //
        if (needsFlipping){
            first_polygons = flip(first_polygons)
        } else {
            last_polygons = flip(last_polygons)
            //walls = flip(walls)
        }

        //csg.polygons
        let all_polygons = []
        all_polygons = all_polygons.concat(first_polygons)
        all_polygons = all_polygons.concat(last_polygons)
        all_polygons = all_polygons.concat(walls)
        // console.log(last.csg.polygons.length, first.csg.polygons.length)

        // all_polygons = _.at(all_polygons, [0,1,2,3,4,5,6,7])
        // console.log(all_polygons)
        let csg = new CSG.fromPolygons(all_polygons)
        return csg//[new Solid(csg)]
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

function select_2d_shapes(solids){
    return _.flatten(_.map(solids, function(solid){
        var selected = []
        if (solid.role === 'cag' || solid.role === '1d'){//csg && solid.csg.properties.type == 'lines'){
            selected.push(solid)
        }
        return selected.concat(select_2d_shapes(solid.children))
    }))
}
