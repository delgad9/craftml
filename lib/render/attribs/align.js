var select = require('../select'),
    _ = require('lodash')

function align_one_dimension(solids, dim, v) {
    var first = solids[0]

    _.rest(solids).forEach(function(solid) {

        // var descendents = solid.find(selector)
            // var top = solid
            // console.log(descendents[0])
            //
            // if (descendents.length > 0) {

        // var d = descendents[0]
            // d.convertCoordinateTo(solid)
        // console.log(d.layout.size)

        // var x = d.layout.location.x - d.layout.size.x / 2
        // var y = d.layout.location.y - d.layout.size.y / 2
            // var z = d.layout.location.x - d.layout.size.x/2

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
function _parse(code) {
    var toks = code.split(' ')
    return _.map(toks, function(e) {
        var m = e.match(/(x|y|z)(-*\d+)/)
        return {
            dim: m[1],
            value: m[2]
        }
    })
}

module.exports = function(solids, element, scope) {

    var ops = _parse(scope.code)

    if (element.attribs['at']) {

        var selector = element.attribs['at']

        _.forEach(ops, function(op) {
            align_one_dimension_at(solids, op.dim, op.value, selector)
        })

    } else {

        _.forEach(ops, function(op) {
            align_one_dimension(solids, op.dim, op.value)
        })
    }
}
