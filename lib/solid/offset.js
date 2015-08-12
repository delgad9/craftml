var Offset = require('polygon-offset')
import G from '../scad/geometry'
import CAG from '../scad/cag'
import CSG from '../scad/csg'

import _ from 'lodash'

export function offset(){
    //console.log('trying to do offset')

    // this.$('')
    let csg = this.children[0].csg
    //this.apply()
    csg = csg.transform(this.m)


    let points = _.map(csg.polygons[0].vertices, v => {
        return {x: v.pos.x, y: v.pos.y}
    })

    var os = new Offset();
    var margined = os.data(points).margin(5);
    var padding = os.data(points).arcSegments(3).offset(-1)

    let newpoints = _.map(padding, p => {
        return new G.Vector2D(p.x, p.y)
    })

    let cag = CAG.fromPoints(newpoints)
    let poly = cag.toPolygon()

    //csg.polygons[0] = new G.Polygon(vertices)
    // console.log(vertices.length)

    csg = CSG.fromPolygons([poly])

    this.removeAll()
    this.add2D(csg)
    this.m = G.Matrix4x4.unity()
    // this.pp()

    //console.log(padding)
}
