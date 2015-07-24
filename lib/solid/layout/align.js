export default function align(solids, dim, v){

    var m
    if (m = v.trim().match(/(-?\d+)%/)){
        v = Number(m[1])
    } else {
        v = 0
    }

    var o   // bounds of the first solid
    solids.forEach(function(s,i) {
        var ref = references[i]
        if (i == 0){

            o = s.layout

        } else {

            var d = {x:0, y:0, z:0}
            var percent = v

            // (o + o.s * p) - (r + r.s * p)
            //
            d[dim] = o.position[dim] +
                    (o.size[dim] - s.layout.size[dim]) * percent / 100
                    - s.layout.position[dim]
            // console.log(solid, ref)
            // solid.transformAt(ref).translate(d.x,d.y,d.z)
            s.translate(d.x,d.y,d.z)
        }
    })
}
