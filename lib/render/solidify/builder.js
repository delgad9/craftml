import _ from 'lodash'
import wallBuilder from './walls'
import {split} from './triangles'

function isPoint(poly) {
    return poly.vertices.length === 1
}

function flip(poly) {
    if (poly.vertices.length >= 3){
        return poly.flipped()
    } else {
        return poly
    }
}

export default class Builder {

    constructor(){
        // an array of an array of polygons
        this.groups = []
        this.flipped = false
    }

    addWallsBetween(poly1, poly2){
        if (isPoint(poly1) && isPoint(poly2)){
            return
        } else if (isPoint(poly1)){
            this.addWallsBetweenPolygonAndPoint(flip(poly2), poly1.vertices[0].pos)
        } else if (isPoint(poly2)){
            this.addWallsBetweenPolygonAndPoint(poly1, poly2.vertices[0].pos)
        } else {
            this.addWallsBetweenPolygons(poly1, poly2)
        }
    }

    addWallsBetweenPolygons(poly1, poly2){
        this.groups.push(wallBuilder.buildBetweenPolygons(poly1, poly2))
        return this
    }

    addWallsBetweenPolygonAndPoint(poly, p){
        this.groups.push(wallBuilder.buildBetweenPolygonAndPoint(poly, p.x, p.y, p.z))
        return this
    }

    addPolygon(poly, flipped) {
        if (!isPoint(poly)){

            if (!poly.isConvex()){
                let triangles = split(poly)
                this.groups.push(triangles)
            } else {
                this.groups.push([poly])
            }

        }

        return this
    }

    addPolygonFlipped(poly) {
        return this.addPolygon(flip(poly))
    }

    addPolygons(polys){
        this.groups.push(polys)
        return this
    }

    flip(){
        this.flipped = !this.flipped
        return this
    }

    build(){
        let allPolygons = _.compact(_.flatten(this.groups, true))
        if (this.flipped){

            return _.map(allPolygons, p => {
                return p.flipped()
            })

        } else {

            return allPolygons
            
        }
    }
}
