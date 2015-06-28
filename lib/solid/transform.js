import _ from 'lodash'
import Matrix4x4 from '../scad/geometry/Matrix4x4'
import Location from '../location'

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

export function centerAt(loc) {
    var size = this.layout.size
    var newLoc = {
        x: loc.x - size.x/2,
        y: loc.y - size.y/2,
        z: loc.z - size.z/2
    }
    this.translateTo(newLoc)
}


export function scale(s) {
    // TODO: handle 0's

    var savedLoc = _.clone(this.layout.location)
    var loc = {
        x: 0,
        y: 0,
        z: 0
    }
    this.translateTo(loc)

    var tm = Matrix4x4.scaling([s.x, s.y, s.z])
    var tn = Matrix4x4.scaling([1/s.x, 1/s.y, 1/s.z])
    this.transform(tm, tn)

    this.translateTo(savedLoc)
}

export function scaleTo(newSize) {
    var oldSize = this.layout.size
    var ratio = {
        x: newSize.x / oldSize.x,
        y: newSize.y / oldSize.y,
        z: newSize.z / oldSize.z
    }
    this.scale(ratio)
}

export function rotate(axis, degrees, point) {
    if (point){
        if (_.isArray(point)){
            var d = {
                x: - point[0],
                y: - point[1],
                z: - point[2]
            }
        }else {
            var d = {
                x: - point.x,
                y: - point.y,
                z: - point.z
            }
        }
    } else {
        // w.r.t. center
        var s = this.layout.size
        var o = this.layout.location
        var d = {
            x: - (s.x / 2) - o.x,
            y: - (s.y / 2) - o.y,
            z: - (s.z / 2) - o.z
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

    this.updateLayoutForAncestors()
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
    this.transform(m, m)
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
