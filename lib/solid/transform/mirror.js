import Plane from '../../scad/geometry/Plane'
import Vector3D from '../../scad/geometry/Vector3D'
import Matrix4x4 from '../../scad/geometry/Matrix4x4'

export function mirror(dim, offset){

    var normal
    if (dim == 'x'){
        normal = new Vector3D(1, 0, 0)
    } else if (dim == 'y'){
        normal = new Vector3D(0, 1, 0)
    } else if (dim == 'z'){
        normal = new Vector3D(0, 0, 1)
    } else {
        return
    }

    var w
    if (arguments.length === 2){
        w = - offset
    } else if (arguments.length === 1){
        w = - this.position[dim] - this.size[dim] / 2
    }
    var plane = new Plane(normal, w)
    var m = Matrix4x4.mirroring(plane)
    this.flipped = !this.flipped
    this.transform(m, m)
}
