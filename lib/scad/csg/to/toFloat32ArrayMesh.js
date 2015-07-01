var seidel = require('seidel')

module.exports = function toFloat32ArrayMesh() {

    var numvertices = 0
    this.polygons.forEach(function(p) {

        // if (p.vertices.length > 3){
        //
        //     var vs = p.vertices.map(function(v){
        //         return [v.pos._x,v.pos._y]
        //     })
        //     var ts = seidel([vs.slice(1)])
        //     console.log(ts.length)
        //     p.ts = ts
        // }

        numvertices += (p.vertices.length - 2) * 3
    })

    // console.log('# polygons', this.polygons.length)

    var vertexData = new Float32Array(numvertices * 3),
        normalData = new Float32Array(numvertices * 3)

    var verticesArrayIndex = 0
    function push(vertex, n){
        var pos = vertex.pos;
        vertexData[verticesArrayIndex] = pos._x;
        vertexData[verticesArrayIndex+1] = pos._y;
        vertexData[verticesArrayIndex+2] = pos._z;
        normalData[verticesArrayIndex] = n._x;
        normalData[verticesArrayIndex+1] = n._y;
        normalData[verticesArrayIndex+2] = n._z;
        verticesArrayIndex += 3
    }

    function push1(t, n, z){
        vertexData[verticesArrayIndex] = t.x;
        vertexData[verticesArrayIndex+1] = t.y;
        vertexData[verticesArrayIndex+2] = z
        // normalData[verticesArrayIndex] = n._x;
        // normalData[verticesArrayIndex+1] = n._y;
        // normalData[verticesArrayIndex+2] = n._z;
        verticesArrayIndex += 3
    }

    this.polygons.forEach(function(p) {
            //numvertices += p.vertices.length

            if ('ts' in p){

                // var f = p.ts[0]
                var z = p.vertices[0].pos._z
                // var n = p.plane.normal

                // console.log(p.ts[0],p.ts.length,z,n)
                for (var i = 0; i < p.ts.length; i++) {
                    // console.log(p.ts[i])
                    push1(p.ts[i][0], n, z)
                    push1(p.ts[i][1], n, z)
                    push1(p.ts[i][2], n, z)
                }

            } else {

                var firstVertex = p.vertices[0]
                var n = p.plane.normal
                for (var i = 0; i < p.vertices.length - 2; i++) {
                    push(firstVertex, n)
                    push(p.vertices[i + 1], n)
                    push(p.vertices[i + 2], n)
                }

            }
        })

    return {
        vertices: vertexData,
        normals: normalData
    }
}
