import _ from 'lodash'
import stl from '../stl'
import Solid from '../solid'
import Plane from '../scad/geometry/plane'    

function createCSGFrom(stlstring) {

    console.time('stl parsing')
    let csg = stl.parse(stlstring, 'craftml')
    console.timeEnd('stl parsing')

    console.time('fixing')
    _.forEach(csg.polygons, poly => {

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
    _.remove(csg.polygons, poly => {
        return _.isNaN(poly.plane.w)
    })
    console.timeEnd('fixing')

    return csg
}

let csgCache = {}

export default function render_stl(render, element, scope) {

    var contents = element.attribs['contents']

    let key = element.attribs['src']

    // create (or read from cache) a csg based on 'contents'
    let csg
    if (key in csgCache){
        csg = csgCache[key]
    } else {
        csg = createCSGFrom(contents, 'craftml', element)
        csgCache[key] = csg
    }

    // create a solid based on the imported csg
    let solid = new Solid(csg)
    // automatically center to (0,0,0)
    solid.centerAt(0,0,0)
    // cancel the effect of mirrorY(0)
    solid.mirrorY()

    return solid
}
