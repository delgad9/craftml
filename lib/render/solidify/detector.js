import _ from 'lodash'

function isPoint(poly) {
    return poly.vertices.length === 1
}


function computeDirection(poly1, poly2){
    return poly1.plane.signedDistanceToPoint(poly2.vertices[0].pos) > 0
}

export default class Detector{

    constructor(polygons){
        this.polygons = polygons
    }

    // method to detect if the given set of polygons would form an inverted solid
    isInverted(){

        let first = _.first(this.polygons)
        let last = _.last(this.polygons)

        // first "non-point" geometry
        let polygon = _.find(this.polygons, poly => {
            return !isPoint(poly)
        })

        let d
        if (!isPoint(first)){

            // polygon -> polygon
            //  or
            // polygon -> point

            d = first.plane.signedDistanceToPoint(last.vertices[0].pos)

        } else if (isPoint(first) && !isPoint(last)){

            // point -> polygon

            d = - last.plane.signedDistanceToPoint(first.vertices[0].pos)

        } else {

            // point -> point

            d = - polygon.plane.signedDistanceToPoint(first.vertices[0].pos)
        }

        if (polygon.isConvex()){
            return d > 0
        } else {
            return d < 0
        }
    }

    // method to detect if the given set of polygons form a torus
    isTorus(){

        if (_.some(this.polygons, poly => {return poly.vertices.length < 3})){
            return false
        }

        let directionFirstLast = computeDirection(_.first(this.polygons), _.last(this.polygons))
        let directionFirstSecond = computeDirection(_.first(this.polygons), _.get(this.polygons,1))

        //console.log('dir', directionFirstLast, directionFirstSecond)
        return directionFirstLast != directionFirstSecond
    }
}
