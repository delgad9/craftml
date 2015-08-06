import {Matrix4x4} from './geometry'
export function translate(v){
    var tm = Matrix4x4.translation([v.x, v.y, v.z])
    this.transform(tm)
}
