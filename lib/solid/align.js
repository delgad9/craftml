var select = require('../render/select'),
    _ = require('lodash')

module.exports = function align(code, selector){
    if (code.match(/[x-z]\d+/)){
        return align_v1.bind(this)(code, selector)
    } else {
        return align_v2.bind(this)(code, selector)
    }
}

function align_v1(code, selector){
    var solids = this.children
    var ops = _parse_v1(code)
    if (selector) {

        _.forEach(ops, function(op) {
            align_one_dimension_at(solids, op.dim, op.value, selector)
        })

    } else {

        _.forEach(ops, function(op) {
            align_one_dimension(solids, op.dim, op.value)
        })
    }
}

function align_one_dimension(solids, dim, v) {
    var first = solids[0]

    _.rest(solids).forEach(function(solid) {

        var newLoc = _.clone(solid.layout.location)
        var percent = v
        if (!isNaN(percent)) {
            newLoc[dim] = first.layout.location[dim] +
                (first.layout.size[dim] - solid.layout.size[dim]) * percent / 100
        }
        solid.translateTo(newLoc.x, newLoc.y, newLoc.z)
    })
}


function align_one_dimension_at(solids, dim, v, selector) {
    var first

    solids.forEach(function(solid, index) {

        var matches = solid.find(selector)
        if (matches.length > 0) {

            var descendent = matches[0]
            descendent.convertCoordinateTo(solid.parent)

            if (index === 0) {

                first = descendent

            } else {

                var delta = {x:0, y:0, z:0}
                var percent = v
                if (!isNaN(percent)) {

                    delta[dim] = first.layout.location[dim]
                        + (first.layout.size[dim] - descendent.layout.size[dim]) * percent / 100
                        - descendent.layout.location[dim]

                }

                solid.select(descendent).translate(delta.x, delta.y, delta.z)
            }



        } else {

            if (index === 0) {

                first = solid//solids[0]

            } else {


                var delta = {x:0, y:0, z:0}
                var percent = v
                if (!isNaN(percent)) {

                    delta[dim] = first.layout.location[dim]
                        + (first.layout.size[dim] - solid.layout.size[dim]) * percent / 100
                        - solid.layout.location[dim]

                }

                solid.translate(delta.x, delta.y, delta.z)
            }

        }
    })
}

// e.g.,
//
// code = 'x50 y50'
//
// code = 'x50 y100 z0'
//
// code = 'x-50 y100 z0'
//
// ===>
//
// [{dim: 'x', value: 50}, {dim: 'y', value: 50}]
//
function _parse_v1(code) {
    var toks = code.split(' ')
    return _.map(toks, function(e) {
        var m = e.match(/(x|y|z)(-*\d+)/)
        return {
            dim: m[1],
            value: m[2]
        }
    })
}


function align_v2(code, selector){

    var solids = this.children
    var ops = _parse_v2(code)

    var references
    if (selector){

        references = _.map(solids, function(solid) {

                var matches = solid.find(selector)
                if (matches.length > 0) {
                    var descendent = matches[0]
                    descendent.convertCoordinateTo(solid.parent)
                    return descendent

                } else {

                    return solid
                }


         })

    } else {

        references = solids

    }


    _.forEach(ops, function(op) {

        if (op.name === 'lineup'){
            lineup_one_dimension_v2(solids, references, op.dim, op.spacing, op.direction)
        } else if (op.name === 'align'){
            align_one_dimension_v2(solids, references, op.dim, op.value)
        }
    })
}

// function lineup_one_dimension_v2_backup(solids, references, dim, spacing, direction){
//
//     if (direction == 1){
//
//         var d
//         solids.forEach(function(solid, i) {
//             var ref = references[i]
//
//             if (i == 0){
//                 d = ref.layout.location[dim]
//             } else {
//                 var delta = {x:0, y:0, z:0}
//                 delta[dim] = d - ref.layout.location[dim]
//                 solid.select(ref).translate(delta)
//             }
//             d = d + ref.layout.size[dim] + spacing
//         })
//
//     } else if (direction == -1){
//
//         solids.forEach(function(solid, i) {
//             var ref = references[i]
//
//             if (i == 0){
//                 d = ref.layout.location[dim] - spacing
//             } else {
//                 var delta = {x:0, y:0, z:0}
//                 delta[dim] = (d - ref.layout.size[dim]) - ref.layout.location[dim]
//                 solid.select(ref).translate(delta)
//                 d = d - ref.layout.size[dim] - spacing
//             }
//         })
//
//     }
// }

function lineup_one_dimension_v2(solids, references, dim, spacing, direction){

    var iter
    if (direction == -1){
        iter = _.forEachRight
    } else {
        iter = _.forEach
    }

    var d
    iter(solids, function(solid, i) {
        var ref = references[i]

        if (_.isUndefined(d)){
            d = ref.layout.location[dim]
        } else {
            var delta = {x:0, y:0, z:0}
            delta[dim] = d - ref.layout.location[dim]
            solid.select(ref).translate(delta)
        }
        d = d + ref.layout.size[dim] + spacing
    })
}

function align_one_dimension_v2(solids, references, dim, v) {

    var o   // bounds of the first solid
    solids.forEach(function(solid,i) {
        var ref = references[i]
        if (i == 0){

            o = ref.layout

        } else {

            var d = {x:0, y:0, z:0}
            var percent = v


            // (o + o.s * p) - (r + r.s * p)
            //
            d[dim] = o.location[dim] +
                    (o.size[dim] - ref.layout.size[dim]) * percent / 100
                    - ref.layout.location[dim]

            solid.select(ref).translate(d.x,d.y,d.z)
        }
    })

}



// e.g.,
//
//
// code = '~10~> ~~|  ~~~'
//
// code = '~10~> ~~|  |~~'
//
// ===>
//
// [{dim: 'x', value: 50}, {dim: 'y', value: 50}]
//

function _parse_v2(code) {
    var toks = code.split(' ')
    var dims = ['x','y','z']
    return _.map(toks, function(e,i) {

        var d = dims[i]
        var m
        if (m = e.match(/~(\-?\d*)~>/)){
            return {
                dim: d,
                name: 'lineup',
                spacing: Number(m[1]),
                direction: 1
            }
        } else if (m = e.match(/<~(\-?\d*)~/)){
            return {
                dim: d,
                name: 'lineup',
                spacing: Number(m[1]),
                direction: -1
            }
        } else if (e == '|~~'){
            return {
                dim: d,
                name: 'align',
                value: 0
            }
        } else if (e == '~|~'){
            return {
                dim: d,
                name: 'align',
                value: 50
            }
        } else if (e == '~~|'){
            return {
                dim: d,
                name: 'align',
                value: 100
            }
        } else if (e == '~~~'){
            return {
                dim: d,
                name: ' none'
            }
        } else {
            return {
                dim: d,
                name: 'align',
                value: e
            }
        }
    })
}
