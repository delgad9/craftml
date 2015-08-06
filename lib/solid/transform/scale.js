import {Matrix4x4} from './geometry'

export function scale(s) {

    // default to scale with respect to the object origin
    let anchorPosition = {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
    }

    // TODO: handle 0's
    var tm = Matrix4x4.scaling([s.x, s.y, s.z])
    this.transform(tm)
    this.translateTo(anchorPosition)
}
