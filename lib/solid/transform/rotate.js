import {Matrix4x4} from './geometry'

export function rotate(axis, degrees, ...point) {

    if (point.length === 3){
        var d = {
            x: - point[0],
            y: - point[1],
            z: - point[2]
        }
    } else if (point.length === 1){
        var d = {
            x: - point[0].x,
            y: - point[0].y,
            z: - point[0].z
        }
    } else {

        // w.r.t. center
        var s = this.size
        var o = this.position
        var d = {
            x: - s.x/2 - o.x,
            y: - s.y/2 - o.y,
            z: - s.z/2 - o.z
        }
    }


    if (axis == 'x'){
        degrees = -degrees
    }

    var Rm = Matrix4x4['rotation' + axis.toUpperCase()](degrees)
    var Tm = Matrix4x4.translation([d.x,d.y,d.z])
    var Tn = Matrix4x4.translation([-d.x,-d.y,-d.z])
    var Rn = Matrix4x4['rotation' + axis.toUpperCase()](-degrees)

    var tm = Tm.multiply(Rm).multiply(Tn)
    var tn = Tm.multiply(Rn).multiply(Tn)

    this.transform(tm, tn)
    this.apply()
}
