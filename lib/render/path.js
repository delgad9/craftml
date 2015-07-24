import Promise from 'bluebird'
import _ from 'lodash'
import parse  from 'svg-path-parser'
import G from '../scad/geometry'
import CAG from '../scad/cag'
import CSG from '../scad/csg'
import Solid from '../solid'
import bezier from 'bezier'


class Path {
    constructor(x, y) {
        this.p = new G.Vector2D(x, y)
        this.ps = [this.p]
    }

    curveTo(q, c1, c2){
        let x = [this.p.x, c1.x, c2.x, q.x]
        let y = [this.p.y, c1.y, c2.y, q.y]

        for (let t = 0.1; t < 0.95; t += 0.1){
            let q = new G.Vector2D(bezier(x,t), bezier(y,t))
            this.ps.push(q)
        }
        this.p = new G.Vector2D(q.x, q.y)
        this.p.c2 = c2
        this.ps.push(this.p)
    }

    quadraticCurveTo(q, c1) {
        let x = [this.p.x, c1.x, q.x]
        let y = [this.p.y, c1.y, q.y]

        for (let t = 0.1; t < 0.95; t += 0.1){
            let q = new G.Vector2D(bezier(x,t), bezier(y,t))
            this.ps.push(q)
        }
        this.p = new G.Vector2D(q.x, q.y)
        this.p.c1 = c1
        this.ps.push(this.p)
    }

    smoothQuadraticCurveTo(q) {
        let c1 = {
            x: 2 * this.p.x - this.p.c1.x,
            y: 2 * this.p.y - this.p.c1.y
        }
        this.quadraticCurveTo(q, c1)
    }

    smoothCurveTo(q, c2){
        let c1 = {
            x: 2 * this.p.x - this.p.c2.x,
            y: 2 * this.p.y - this.p.c2.y
        }
        this.curveTo(q, c1, c2)
    }

    lineTo(q){
        this.p = new G.Vector2D(q.x, q.y)
        this.ps.push(this.p)
    }

    toPolygon(){

        if (_.first(this.ps).equals(_.last(this.ps))){
            // get rid of the redundant begin/end point
            this.ps = this.ps.slice(1)
        }

        let cag = CAG.fromPoints(this.ps)
        let poly = cag.toPolygon()
        return poly
    }
}

export default function render_path($solid, $element, $scope) {

    let d = $scope.resolve($element.attribs['d'])
    let pathData = parse(d)

    // console.log(pathData)

    let polygons = []
    function addPolygon(path){
        polygons.push(path.toPolygon())
    }

    let path

    // console.log(d)

    _.forEach(pathData, (d,i) => {

        // console.log('code', d.code, d)

        if (d.code == 'M') {
            if (path)   {
                addPolygon(path)
            }

            path = new Path(d.x, d.y)
        } else if (d.code == 'c') {

            let p = path.p
            let c1 = {x: p.x + d.x1, y: p.y + d.y1}
            let c2 = {x: p.x + d.x2, y: p.y + d.y2}
            let q = {x: p.x + d.x, y: p.y + d.y}

            path.curveTo(q,c1,c2)

        } else if (d.code == 'C') {

            let c1 = {x: d.x1, y: d.y1}
            let c2 = {x: d.x2, y: d.y2}
            let q = {x: d.x, y: d.y}

            path.curveTo(q,c1,c2)

        } else if (d.code == 'q') {

            let p = path.p
            let c1 = {x: p.x + d.x1, y: p.y + d.y1}
            let q = {x: p.x + d.x, y: p.y + d.y}

            path.quadraticCurveTo(q,c1)

        } else if (d.code == 'Q') {

            let c1 = {x: d.x1, y: d.y1}
            let q = {x: d.x, y: d.y}

            path.quadraticCurveTo(q,c1)

        } else if (d.code == 't') {

            let p = path.p
            let q = {x: p.x + d.x, y: p.y + d.y}
            path.smoothQuadraticCurveTo(q)

        } else if (d.code == 'T') {

            let q = {x: d.x, y: d.y}
            path.smoothQuadraticCurveTo(q)

        } else if (d.code == 'L'){

            let q = {x: d.x, y: d.y}
            path.lineTo(q)

        } else if (d.code == 'l'){

            let p = path.p
            let q = {x: p.x + d.x, y: p.y + d.y}
            path.lineTo(q)

        } else if (d.code == 'S') {

            let c2 = {x: d.x2, y: d.y2}
            let q = {x: d.x, y: d.y}
            path.smoothCurveTo(q, c2)

        } else if (d.code == 's') {

            let p = path.p
            let c2 = {x: p.x + d.x2, y: p.y + d.y2}
            let q = {x: p.x + d.x, y: p.y + d.y}
            path.smoothCurveTo(q, c2)

        } else if (d.code == 'v'){

            let p = path.p
            let q = {x: p.x, y: p.y + d.y}
            path.lineTo(q)

        } else if (d.code == 'V'){

            let p = path.p
            let q = {x: p.x, y: d.y}
            path.lineTo(q)

        } else if (d.code == 'h'){

            let p = path.p
            let q = {x: p.x + d.x, y: p.y}
            path.lineTo(q)

        } else if (d.code == 'H'){

            let p = path.p
            let q = {x: d.x, y: p.y}
            path.lineTo(q)

        } else if (d.code == 'Z'){

            addPolygon(path)
            path = null

        }

    })

    let csg = CSG.fromPolygons(polygons)
    $solid.add2D(csg)
}
