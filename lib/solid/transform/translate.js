import Matrix4x4 from '../../scad/geometry/Matrix4x4'
export function translate(v){
    var tm = Matrix4x4.translation([v.x, v.y, v.z])
    this.transform(tm)
}
