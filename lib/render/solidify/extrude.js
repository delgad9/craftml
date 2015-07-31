import _ from 'lodash'
import earcut from 'earcut'

import G from '../../scad/geometry'
import CAG from '../../scad/cag'
import CSG from '../../scad/csg'
import Solid from '../../solid'

import walls from './walls'


import {split} from './triangles'

export default function linear_extrude_polygon_list(polygons){

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

// export default function linear_extrude_with_multiple_holes(solid){
//     return linear_extrude_polygon_list(solid.csg.polygons)
// }

// does poly1 contain poly2?
function contains(poly1, poly2) {


    if (!poly1.isConvex()){

        let ret =  containsConcav(poly1, poly2)
        //console.log('check concav', ret)
        return ret
    }

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

function checkIfPolygonContainPoint(poly, point){
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    var x = point._x, y = point._y;
    var vs = _.pluck(poly.vertices, 'pos')

    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i]._x, yi = vs[i]._y;
        var xj = vs[j]._x, yj = vs[j]._y;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function containsConcav(poly1, poly2){

    // convert this to a set of triangles first
    let triangles = split(poly1)

    // all vertices in poly2 should be found inside one of these triangles

    return _.all(poly2.vertices, v => {

        return _.some(triangles, t => {

                return checkIfPolygonContainPoint(t, v.pos)

        })
    })
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

//


// wholePolygon
// => must be annotated already
//
// turn a 2D shape into a thin 3D disk with thickness = 1
function linear_extrude_polygon(wholePolygon){

    // let holePolygons = wholePolygon.children
    //
    // let [convex, concav] = _.partition(holePolygons, h => {
    //     return h.isConvex()
    // })

    //return extrude_with_convex_holes(wholePolygon, [])

    //function extrude_with_convex_holes(wholePolygon){

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

        let oneSidePolygons = _.map(trianglePolygons, poly => {
            return poly.flipped()
        })
        let anotherSidePolygons = _.map(oneSidePolygons, poly => {
                return poly.translate([0,0,1]).flipped()
        })

        let wholePolygon_offset = wholePolygon.translate([0,0,1])
        let exteriorWalls = walls.buildBetweenPolygons(wholePolygon, wholePolygon_offset, true)

        let holeWalls = []
        _.forEach(holePolygons, holePolygon => {
            let holePolygon_offset = holePolygon.translate([0,0,1])
            holeWalls = holeWalls.concat(walls.buildBetweenPolygons(holePolygon, holePolygon_offset, true))
        })

        holeWalls = _.map(holeWalls, poly => {
            return poly.flipped()
        })

        let allPolygons = _.flatten([oneSidePolygons, anotherSidePolygons, exteriorWalls, holeWalls])
        // let allPolygons = _.flatten([oneSidePolygons])//, exteriorWalls, holeWalls])
        // let allPolygons = _.flatten([eholeWalls])

        let csg = new CSG.fromPolygons(allPolygons)
        let solid = new Solid(csg)
        solid.role = 'csg'
        solid.name = 'polyhedron'
        return solid
    //}
}
