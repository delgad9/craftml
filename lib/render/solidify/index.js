import Promise from 'bluebird'
import _ from 'lodash'
import parse  from 'svg-path-parser'
import G from '../../scad/geometry'
import CAG from '../../scad/cag'
import CSG from '../../scad/csg'
import Solid from '../../solid'
import earcut from 'earcut'

import {
    render, renderElementList
}
from '../render'

export default function solidify($scope) {

    return renderElementList(this, this.src.children, $scope)
        .then(() => {
            let solidified = solidify_solids(this)

            this.removeAll()
            _.forEach(solidified.children, c => {
                this.add(c)
            })

            this.fitToChildren()
            this.applyStyleRecursively(this.css)
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

    let [p1,p2] = planes
    let p3 = p1.flipped()   // if there are slipped, consider them co-planer
    return p1.equals(p2) || p3.equals(p2)
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

import linear_extrude_polygon_list from './extrude'
import solid_from_slices from './slices'

export function solidfy_shapes(shapes){
    if (shapes.length == 1){

        let polygons = _.first(shapes).csg.polygons
        return linear_extrude_polygon_list(polygons)

    } else if (shapes.length > 1){


        let noPoint = !_.some(shapes, s => {return s.name == 'point'})

            // let csg = solid_from_slices(shapes)
            // let p = new Solid(csg)
            // p.name = 'polyhedron'
            // p.role = 'csg'
            // let g = Solid.fromGroup([p])
            // return g

        if( noPoint && isCoplaner(shapes) ){

            let all_polygons = _.flatten(_.pluck(shapes, 'csg.polygons'))

            return linear_extrude_polygon_list(all_polygons)

        } else {

            let csg = solid_from_slices(shapes)
            let p = new Solid(csg)
            p.name = 'polyhedron'
            p.role = 'csg'
            let g = Solid.fromGroup([p])
            return g

        }

    }
}

function solidify_solids(solid){
    solid.apply()
    let shapes = select_2d_shapes([solid])
    return solidfy_shapes(shapes)
}
