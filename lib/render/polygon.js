import CAG from '../scad/cag'
import CSG from '../scad/csg'
import G from '../scad/geometry'
import _ from 'lodash'

export default function render_polygon($scope) {

    // TODO: pre-parse 'points'
    let pointsString = this.attribs['points'] || ''

    // 1,2, 1,4 -- >[[1,2],[1,4]]

    let ps = _.map(pointsString.split(' '), tok => {
        return _.map(tok.split(','), Number)
    })

    let points = _.map(ps, p =>{
        return new G.Vector2D(p)
    })

    let cag = CAG.fromPoints(points)
    let poly = cag.toPolygon()
    let csg = CSG.fromPolygons([poly])

    this.csg = csg
    this.fitToCSG()
    this.role= 'cag'    
}
