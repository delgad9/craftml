import _ from 'lodash'
import G from '../../scad/geometry'
import CSG from '../../scad/csg'

import Builder from './builder'
import Detector from './detector'

function collect_polygons(solids){

    return _.map(solids, s => {

        if (s.csg){
            return s.csg.polygons[0]
        } else {
            let pos = new G.Vector3D(s.position.x, s.position.y, s.position.z)
            let vertex = new G.Vertex(pos)
            return {
                vertices: [vertex]
            }
        }

    })
}

export default function solid_from_slices(solids){

        let polygons = collect_polygons(solids)

        let builder = new Builder()
        let detector = new Detector(polygons)

        //
        // Build walls between every consecutive pair of 2D polygons
        //

        // create a list of pairs of polygons
        let pairs = _.zip(_.initial(polygons), _.rest(polygons))

        // for each pair, build wallls between
        _.forEach(pairs, _.spread( (poly1, poly2) => {
                builder.addWallsBetween(poly1, poly2)
        }))

        //
        // Build the last section depending on whether it is a torus
        //

        let startPolygon = _.first(polygons)
        let endPolygon = _.last(polygons)
        if (detector.isTorus()){

            builder.addWallsBetween(endPolygon, startPolygon)

        } else {

            builder.addPolygon(startPolygon)
            builder.addPolygonFlipped(endPolygon)
        }

        if (detector.isInverted()){
            builder.flip()
        }

        let csg = new CSG.fromPolygons(builder.build())
        return csg
}
