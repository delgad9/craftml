var stl = require('../stl'),
    Solid = require('../solid'),
    _ = require('lodash'),
    Promise = require("bluebird"),
    Plane = require('../scad/geometry/plane')

function _createSolidFromStlString(stlstring, src, element) {

    var csg = stl.parse(stlstring, 'craftml')
    var solid = new Solid(csg)

    _.forEach(solid.csg.polygons, poly => {

        if (!_.isFinite(poly.plane.w)){
            // something bad about the normal vector
            // skip? or recompute?
            // console.log(poly.vertices[0].pos, poly.vertices[1].pos, poly.vertices[2].pos)
            let plane = Plane.fromVector3Ds(poly.vertices[0].pos, poly.vertices[1].pos, poly.vertices[2].pos)
            // console.log(plane)
        }

        let {x:nx,y:ny,z:nz} = poly.plane.normal
        // console.log(nx,ny,nz)
        if (nx == 0 && ny == 0 && nz == 0){
            // bad normal vector
            // console.log(poly)
            // console.log(poly.vertices[0].pos, poly.vertices[1].pos, poly.vertices[2].pos)
            // let plane = Plane.fromVector3Ds(poly.vertices[0].pos, poly.vertices[1].pos, poly.vertices[2].pos)
            // console.log(plane)
        }
    })

    // fix, remove those with bad normal vectors
    // (e.g., along the same line)
    _.remove(solid.csg.polygons, poly => {
        return _.isNaN(poly.plane.w)
    })

    // TODO: auto-inverse
    // solid.csg = solid.csg.inverse()

    // TODO: make this settable
    // normalize to fit a cubic volume of 'targetDim'
    var normalize = true
    if (normalize) {
        var targetDim = 20
        var bs = csg.getBounds()
        var xs = bs[1].x - bs[0].x
        var ys = bs[1].y - bs[0].y
        var zs = bs[1].z - bs[0].z
        var maxDim = _.max([xs, ys, zs])
        var factor = targetDim / maxDim

        solid.translateTo({x:0,y:0,z:0})

        var p = new Solid()
        p.tag = 'group'
        p.children = [solid]
        p.fitToChildren()
        p.scale({x:factor,y:factor,z:factor})

        return p

    }else{

        return solid
    }
}

export default function render_stl(render, element, scope) {

    var contents = element.attribs['contents']

    return new Promise(function(resolve, reject){
        var solid = _createSolidFromStlString(contents, 'craftml', element)
        resolve(solid)
    })
}
