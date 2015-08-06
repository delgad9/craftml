import {Matrix4x4} from './geometry'
import _ from 'lodash'

export function translateTo(v) {

    // update transformation matrix
    let d = {}
    _.forEach(v, (p, dim) => {
        d[dim] = p - this.position[dim]
    })

    let tm = Matrix4x4.translation([d.x, d.y, d.z])
    this.transform(tm)
}
