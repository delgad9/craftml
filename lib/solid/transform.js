import _ from 'lodash'
import Matrix4x4 from '../scad/geometry/Matrix4x4'
import Location from '../location'
import Size from '../size'
import Plane from '../scad/geometry/Plane'
import Vector3D from '../scad/geometry/Vector3D'
import Vertex from '../scad/geometry/Vertex'
import Polygon from '../scad/geometry/Polygon'
import CSG from '../scad/csg'

// function _fitToChildren_recursively_up(solid){
//     if (solid.parent){
//         solid.parent.fitToChildren()
//         _fitToChildren_recursively_up(solid.parent)
//     }
// }

// compute a combined transformation matrix to an ancestor
function _compute_tm_from_to(solid, ancestor){
    if (solid.parent && solid.parent === ancestor){
        return {m: solid.m, n: solid.n}
    } else if (solid.parent){
        var r = _compute_tm_from_to(solid.parent, ancestor)
        if (r)
            return {m: solid.m.multiply(r.m), n: r.n.multiply(solid.n)}
    }
}

export function transform(tm, tn) {
    // update layout
    this.layout.transform(tm)

    // if the layout is referening to another node's coordinte system
    if (this.layout_reference) {
        var r = _compute_tm_from_to(this.parent, this.layout_reference)
        tm = r.m.multiply(tm).multiply(r.n)
        tn = r.m.multiply(tn).multiply(r.n)
    }

    this.m = this.m.multiply(tm)
    this.n = tn.multiply(this.n)

    this.box.transform(tm)
}

export function setDim(dim, value){
    let d = {x:0, y:0, z:0}
    d[dim] = value - this.layout.location[dim]
    this.translate(d.x,d.y,d.z)
}

export function land(){
    let dz = - this.layout.location.z
    this.translate(0,0,dz)
}

export function translate(loc){
    // update transformation matrix

    var tm = Matrix4x4.translation([loc.x, loc.y, loc.z])
    var tn = Matrix4x4.translation([-loc.x, -loc.y, -loc.z])

    this.transform(tm, tn)
}

export function translateTo(loc){

    // update transformation matrix
    var d = {}
    _.forEach(loc, function(v, dim){
        d[dim] = v - this.layout.location[dim]
    }, this)

    var tm = Matrix4x4.translation([d.x, d.y, d.z])
    var tn = Matrix4x4.translation([-d.x, -d.y, -d.z])
    this.transform(tm, tn)
}

export function center(loc) {
    var size = this.layout.size
    var newLoc = {
        x: loc.x - size.x/2,
        y: loc.y - size.y/2,
        z: loc.z - size.z/2
    }
    this.translateTo(newLoc)
}

export function centerDim(dim, v = 0) {
    var size = this.layout.size
    var v1 = v - size[dim]/2
    this.setDim(dim, v1)
}

export function scale(s) {
    // with respect to the origin of the coordinate system the solid is in

    var center = {
        x: this.layout.location.x + this.layout.size.x / 2,
        y: this.layout.location.y + this.layout.size.y / 2,
        z: this.layout.location.z + this.layout.size.z / 2
    }

    //
    // TODO: handle 0's

    // var savedLoc = _.clone(this.layout.location)
    // var loc = {
    //     x: 0,
    //     y: 0,
    //     z: 0
    // }
    // this.translateTo(loc)

    var tm = Matrix4x4.scaling([s.x, s.y, s.z])
    var tn = Matrix4x4.scaling([1/s.x, 1/s.y, 1/s.z])
    this.transform(tm, tn)

    this.center(center)//savedLoc)
}

export function resize(newSize) {

    var savedLoc = _.clone(this.layout.location)
    this.translateTo(0,0,0)

    var oldSize = this.layout.size
    var ratio = {
        x: newSize.x / oldSize.x,
        y: newSize.y / oldSize.y,
        z: newSize.z / oldSize.z
    }
    this.scale(ratio)

    this.translateTo(savedLoc)
}

export function resizeDim(dim, v) {

    let newSize = _.clone(this.layout.size)
    newSize[dim] = v
    this.resize(newSize)
}

export function fit(newSize) {
    var oldSize = this.layout.size
    var ratios = [newSize.x / oldSize.x, newSize.y / oldSize.y, newSize.z / oldSize.z]
    var ratio = _.min(ratios)
    this.scale(ratio)
}

export function turn(axis, degrees) {

    // w.r.t. center
    var s = this.layout.size
    var o = this.layout.location
    var d = {
        x: - (s.x / 2) - o.x,
        y: - (s.y / 2) - o.y,
        z: - (s.z / 2) - o.z
    }

    if (axis == 'x'){
        degrees = -degrees
    }

    var Rm = Matrix4x4['rotation' + axis.toUpperCase()](degrees)
    var Tm = Matrix4x4.translation([d.x,d.y,d.z])
    var Tn = Matrix4x4.translation([-d.x,-d.y,-d.z])
    var Rn = Matrix4x4['rotation' + axis.toUpperCase()](-degrees)

    var tm = Tm.multiply(Rm).multiply(Tn)
    var tn = Tm.multiply(Rn).multiply(Tn)

    this.transform(tm, tn)
}

export function rotate(axis, degrees, ...point) {

    if (point.length === 3){
        var d = {
            x: - point[0],
            y: - point[1],
            z: - point[2]
        }
    } else if (point.length === 1){
        var d = {
            x: - point[0].x,
            y: - point[0].y,
            z: - point[0].z
        }
    } else {

        // w.r.t. origin
        var s = this.layout.size
        var o = this.layout.location
        var d = {
            x: 0,
            y: 0,
            z: 0
        }
    }


    if (axis == 'x'){
        degrees = -degrees
    }

    var Rm = Matrix4x4['rotation' + axis.toUpperCase()](degrees)
    var Tm = Matrix4x4.translation([d.x,d.y,d.z])
    var Tn = Matrix4x4.translation([-d.x,-d.y,-d.z])
    var Rn = Matrix4x4['rotation' + axis.toUpperCase()](-degrees)

    var tm = Tm.multiply(Rm).multiply(Tn)
    var tn = Tm.multiply(Rn).multiply(Tn)

    this.transform(tm, tn)
}

export function mirror(dim, offset){
    var G = require('../scad/geometry')
    var normal
    if (dim == 'x'){
        normal = new G.Vector3D(1, 0, 0)
    } else if (dim == 'y'){
        normal = new G.Vector3D(0, 1, 0)
    } else if (dim == 'z'){
        normal = new G.Vector3D(0, 0, 1)
    } else {
        return
    }

    var w
    if (arguments.length === 2){
        w = - offset
    } else if (arguments.length === 1){
        w = - this.layout.location[dim] - this.layout.size[dim] / 2
    }
    var plane = new G.Plane(normal, w)
    var m = Matrix4x4.mirroring(plane)
    this.flipped = !this.flipped
    this.transform(m, m)
}


// amount can be
//
// {type: percentage, value: 30}
//
// 30
//

//
const MAX_POLYGONS_TO_CROP = 1000

export function crop(dim, amount1 = 0, amount2 = 0){

    if (amount1.type == 'percentage'){
        amount1 = amount1.value * this.layout.size[dim] / 100
    }

    if (amount2.type == 'percentage'){
        amount2 = amount2.value * this.layout.size[dim] / 100
    }

    _crop_helper.call(this, dim, amount1, 'min')
    _crop_helper.call(this, dim, amount2, 'max')

    if (count_polygons(this) < MAX_POLYGONS_TO_CROP){
        this.apply()
    }
}

function count_polygons(solid){
    let s
    if (solid.csg){
        s = solid.csg.polygons.length
    } else {
        s = 0
    }
    s += _.sum(_.map(solid.children, c => {return count_polygons(c)}))
    return s
}

function _crop_helper(dim, amount, from = 'min'){

    if (amount <= 0){
        return
    }

    let d = {
        x:0,
        y:0,
        z:0
    }

    let s = _.clone(this.layout.size)
    s[dim] = this.layout.size[dim] - amount

    // calculate where to move the bounding box in order to match the remaining,
    // uncropped portion
    let l = _.clone(this.layout.location)
    if (from == 'min'){
        l[dim] = l[dim] + amount
    }

    this.layout.transformTo(l, s)
    this.box.transformTo(l, s)
    this.cropped = true
}

function crop1(dim, amount, direction){
    console.log('cropping')
    dim = 'x'
    amount = 5
    direction = 1

    let t = 5

    let cropPlane = new Plane(new Vector3D([0, 0, 1]), 5);

    if (this.csg){
        // console.log(this.csg.polygons)
        let keptPolys = []
        let edgeVerticePairs = []
        _.forEach(this.csg.polygons, poly => {

            let {type, front, back} = cropPlane.splitPolygon(poly)

            if (type == 4){
                keptPolys.push(front)
                let edgeVerticePair = _.filter(front.vertices, v => Math.abs(v.pos.z-5)<0.00001)
                edgeVerticePairs.push(edgeVerticePair)
                // let keys = _.indexBy(cropBoundaryVertices, v => '' + v.pos)
                // console.log(keys)
            } else if (type == 2){
                keptPolys.push(poly)
            }
        })
        // console.log(edgeVerticePairs)
        let keys1 = _.indexBy(edgeVerticePairs, pair => '' + pair[0].pos)
        let keys2 = _.indexBy(edgeVerticePairs, pair => '' + pair[1].pos)
        // collect vertices arond the gap
        // consle.

        // find a connected path through the edges
        let e = edgeVerticePairs[0] // e: [[ ], [ ]]
        let vs = []

        vs.push(e[0])

        let next = keys1[e[1]] ||
            keys2[e[1]]

        console.log('next vertex 1', next, next, keys1[e[1]])

        e = next//edgeVerticePairs[1]
        console.log(e)
        vs.push(e[0])

        next = _.find(keys1[e[1]], ne => ne !== e)
            || _.find(keys2[e[1]], ne1 => ne !== e)

        console.log('next vertex 2' , next.pos)

        // e = edgeVerticePairs[]
        vs.push(e[0])

        next = _.find(keys1[e[1]], ne => ne != e)
            || _.find(keys2[e[1]], ne1 => ne != e)

        console.log('next vertex 3', next.pos)

        // console.log(keys1, keys2)
        // let gapVertices.map


        this.csg = CSG.fromPolygons(keptPolys)
        this.fitToCSG()
    }
}

//
// Group Transformation
//

function translate_group(loc, ancestor){

    var tm = Matrix4x4.translation([loc.x, loc.y, loc.z])
    var tn = Matrix4x4.translation([-loc.x, -loc.y, -loc.z])

    // console.log('tm:', JSON.stringify(tm))

    // update layout
    this.layout.transform(tm)

    if (this.layout_reference){
        var r = _compute_tm_from_to(this.parent, this.layout_reference)
        if (r){
            tm = r.m.multiply(tm).multiply(r.n)
            tn = r.m.multiply(tn).multiply(r.n)

            // console.log('r.m*r.n:', JSON.stringify(r.m.multiply(r.n)))
            // console.log('this.layout_reference', this.layout_reference)
        }
    }

    // console.log('tm:', JSON.stringify(tm))
    // console.log('tn:', JSON.stringify(tn))
    // console.log('tm*tn:', JSON.stringify(tm.multiply(tn)))

    // console.log('m*tm*1m*2m', JSON.stringify(this.m.multiply(tm).multiply(this.parent.m).multiply(this.parent.parent.m)))

    //
    // M * TM * M1 * M2 == M * M1 * M2 * P
    // TM * M1 * M2 == M1 * M2 * P
    // M1^ * TM * M1 * M2 == M2 * P
    // M2^ * M1^ * TM * M1 * M2 == P

    // compute a combined transformation matrix to an ancestor
    function _compute_tm_from_to_root(solid){
        if (solid.parent){
            var r = _compute_tm_from_to_root(solid.parent)
            return {m: solid.m.multiply(r.m), n: r.n.multiply(solid.n)}
        } else {
            return {m: solid.m, n:solid.n}
        }
    }

    function _compute_tm_from_to_root_reverse(solid){
        if (solid.parent){
            var r = _compute_tm_from_to_root_reverse(solid.parent)
            return {m: r.m.multiply(solid.m), n: solid.n.multiply(r.n)}
        } else {
            return {m: solid.m, n:solid.n}
        }
    }

    var pr = _compute_tm_from_to_root(this.parent)
    var qr = _compute_tm_from_to_root_reverse(this.parent)

    // console.log('pr', JSON.stringify(pr))
    // console.log('qr', JSON.stringify(qr))

    var p = pr.n.multiply(tm).multiply(pr.m)
    // var q = qr.m.multiply(tn).multiply(qr.n)
    var q = qr.n.multiply(tn).multiply(qr.m)

    // console.log('p', JSON.stringify(p), JSON.stringify(qr.n.multiply(tm).multiply(pr.m)))
    // console.log('q', JSON.stringify(q), JSON.stringify(pr.m.multiply(tn).multiply(qr.n)))

    function find_root(solid){
        if (solid.parent.parent && solid.parent.parent !== ancestor){
            return find_root(solid.parent)
        } else {
            return solid
        }
    }

    // console.log('p:', JSON.stringify(p))

    var root = ancestor//find_root(this)

    // console.log('p*q:', JSON.stringify(p.multiply(q)))

    root.m = root.m.multiply(p)
    root.n = q.multiply(root.n)

    root.layout.transform(p)
    root.box.transform(p)
}

function TransformSelectedOp(solid, descendent){
    this.solid = solid
    this.descendent = descendent
}

TransformSelectedOp.prototype.translate = function(){
    // var loc = _parse_arguments_to_location(arguments)
    var loc = Location.from(arguments)
    translate_group.apply(this.descendent, [loc, this.solid])
    this.descendent.updateLayoutForAncestors()
}

// Select a descendent as the
export function transformAt(descendent){
    if (descendent === this){
        return this
    } else {
        // if selector is a Solid
        return new TransformSelectedOp(this, descendent)
    }
}
