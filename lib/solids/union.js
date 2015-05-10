var _ = require('lodash'),
    $$$ = require('craft-scad')

var debug = function(){}
// var debug = console.log

module.exports = myunion3

function myunion1(csgs) {
    var all
    csgs.forEach(function(csg, i) {
        console.log('%d of %d, %d + %d', i + 1, csgs.length, all ? all.polygons.length : 0, csg.polygons.length)
        debug('%d of %d, %d + %d', i + 1, csgs.length, all ? all.polygons.length : 0, csg.polygons.length)
        if (i === 0) {
            all = csg
        } else {
            all = all.union(csg)
        }
    })
    return all
}

function myunion4(csgs) {
    var all
    csgs.forEach(function(csg, i) {
        console.log('%d of %d, %d + %d', i + 1, csgs.length, all ? all.polygons.length : 0, csg.polygons.length)
        debug('%d of %d, %d + %d', i + 1, csgs.length, all ? all.polygons.length : 0, csg.polygons.length)
        if (i === 0) {
            all = csg
        } else {
            all = all.unionForNonIntersecting(csg)
        }
    })
    return all
}


function myunion3(csgs) {

    // mayOverlap

    // compute bsp trees for all csgs
    debug('creating bsp trees')
    // console.log('creating bsp trees for %d csgs', csgs.length)

    var ps = _.map(csgs, function(csg, i) {
        debug('%d of %d', i + 1, csgs.length)
        // console.log('%d of %d', i + 1, csgs.length)
        var t = new $$$.CSG.Tree(csg.polygons)

        return {
            csg: csg,
            bsp: t
        }

    })

    debug('clipping')
    // console.log('clipping')

    // assume the bsp tree itself does not change, only the polygons change
    _.forEach(ps, function(p, i) {
        debug('%d of %d', i + 1, ps.length)
        // console.log('%d of %d', i + 1, ps.length)

        // others
        _.forEach(ps.slice(i), function(other, j) {

            if (p !== other && p.csg.mayOverlap(other.csg)) {
                // console.log(j)

                p.bsp.clipTo(other.bsp, false)

                other.bsp.clipTo(p.bsp)
                other.bsp.invert()
                other.bsp.clipTo(p.bsp)
                other.bsp.invert()

            }

        })

    })

    debug('collecting polygons')

    var polygons = []
    _.forEach(ps, function(p, i) {
        debug('%d of %d', i + 1, ps.length)

        polygons = polygons.concat(p.bsp.allPolygons())
    })

    var result = $$$.CSG.fromPolygons(polygons)

    debug('retesselated')
    // result = result.reTesselated()
    debug('cannonicalized')
    // result = result.canonicalized()
    return result
}

// incorrect
function myunion2(csgs) {

    var all, polygons = []

    _.forEach(csgs, function(csg, i) {

        var t = new $$$.CSG.Tree(csg.polygons)

        if (i === 0) {

            all = t

        } else {

            all.clipTo(t)
            t.clipTo(all)
            t.invert()
            t.clipTo(all)
            t.invert()
        }

        polygons = polygons.concat(t.allPolygons())

        // compute bst trees
        debug('%d of %d, add %d polygons, total %d polygons', i + 1, csgs.length, csg.polygons.length, polygons.length)
    })

    // var a = new CSG.Tree(this.polygons);
    // var b = new CSG.Tree(csg.polygons);
    // a.clipTo(b, false);

    // b.clipTo(a, true); // ERROR: this doesn't work
    // b.clipTo(a);
    // b.invert();
    // b.clipTo(a);
    // b.invert();

    // var newpolygons = a.allPolygons().concat(b.allPolygons());
    var result = $$$.CSG.fromPolygons(polygons)
    return result
}
