import Promise from 'bluebird'
import _ from 'lodash'
import parse  from 'svg-path-parser'
import G from '../scad/geometry'
import CAG from '../scad/cag'
import Solid from '../solid'
import bezier from 'bezier'

export default function path(render, element, scope) {

    let d = scope.resolve(element.attribs['d'])
    let pathData = parse(d)

    // console.log(pathData)


    let ps = []

    var p

    // console.log('pathdata', pathData)

    _.forEach(pathData, d => {

        // console.log('code', d.code)

        if (d.code == 'M') {

            p = new G.Vector2D(d.x,d.y)
            ps.push(p)

        } else if (d.code == 'L' || d.code == 'l' || d.code == 'c' || d.code == 'C'){

            if (d.relative){

                if (d.code == 'c'){

                    var x = [p.x, p.x + d.x1, p.x + d.x2, p.x + d.x]
                    var y = [p.y, p.y + d.y1, p.y + d.y2, p.y + d.y]
                    //
                    // _.forEach([0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9], function(t){
                    for (let t = 0.1; t < 1.0; t += 0.1){
                        let q = new G.Vector2D(bezier(x,t), bezier(y,t))
                        ps.push(q)
                    }

                    p = p.plus(new G.Vector2D(d.x,d.y))
                    ps.push(p)

                } else {

                    p = p.plus(new G.Vector2D(d.x,d.y))
                    ps.push(p)

                }

            } else {

                if (d.code == 'C'){

                    var x = [p.x, d.x1, d.x2, d.x]
                    var y = [p.y, d.y1, d.y2, d.y]
                    //
                    // _.forEach([0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9], function(t){
                    for (let t = 0.1; t < 1.0; t += 0.1){
                        let q = new G.Vector2D(bezier(x,t), bezier(y,t))
                        ps.push(q)
                    }

                    p = new G.Vector2D(d.x,d.y)
                    ps.push(p)


                } else {

                    p = new G.Vector2D(d.x,d.y)
                    ps.push(p)

                }
            }

        } else if (d.code == 'v'){

            p = p.plus(new G.Vector2D(0, d.y))
            ps.push(p)

        } else if (d.code == 'h'){

            p = p.plus(new G.Vector2D(d.x, 0))
            ps.push(p)

        }
        //  else if (d.code == 'C' || d.code == 'c') {
        //
        //     p = new G.Vector2D(d.x,d.y)
        //     ps.push(p)
        //
        // }
    })
//
    // console.log('ps',ps)

    // ps = _.initial(ps)

    var cag = CAG.fromPoints(ps)
    var p = cag.toCSGPolygon()
    p.properties.type = 'lines'
    var solid = new Solid(p)
    // auto translate to (0,0)
    solid.translateTo(0,0,0)// Location(0,0,0))
    solid.type = 'lines'

    return Promise.resolve([solid])
    // return Promise.resolve([])
}
