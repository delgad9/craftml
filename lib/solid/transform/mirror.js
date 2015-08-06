import {Plane, Vector3D, Matrix4x4} from './geometry'

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
