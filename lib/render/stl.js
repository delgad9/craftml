import _ from 'lodash'
import stl from '../stl'
import Solid from '../solid'
import Plane from '../scad/geometry/plane'

function createCSG(stlstring) {

    // console.time('stl parsing')
    let csg = stl.parse(stlstring, 'craftml')
    // console.timeEnd('stl parsing')

    // console.time('fixing')
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
    // console.timeEnd('fixing')

    return csg
}

function load_create_csg(load){
    return load
            .get()
            .then(contents => {
                return createCSG(contents)
            })
}
load_create_csg = _.memoize(load_create_csg, (load) => {return load.path})

export default function render_stl($scope) {

    // let url = this.src.attribs.url
    let load = this.src.attribs.load

    return load_create_csg(load)
        .then(csg => {

            // create a solid based on the imported csg
            let solid = new Solid(csg)
            solid.name = 'polyhedron'
            // automatically center to (0,0,0)
            solid.center(0,0,0)
            // and land on z=0
            solid.land()
            // cancel the effect of mirrorY(0)
            solid.mirrorY()

            this.add(solid)

            solid.computeStyle($scope.css)
        })
}
