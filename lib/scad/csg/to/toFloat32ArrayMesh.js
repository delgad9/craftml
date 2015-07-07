var seidel = require('seidel')

// note that we flip the normal direction on export to create mirrorY effect
// for THREE.js

module.exports = function toFloat32ArrayMesh(flipped = false) {

    var numvertices = 0
    this.polygons.forEach(function(p) {
        numvertices += (p.vertices.length - 2) * 3
    })

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

    this.polygons.forEach(function(p) {

        var firstVertex = p.vertices[0]
        var n = p.plane.normal
        for (var i = 0; i < p.vertices.length - 2; i++) {

            push(firstVertex, n)
            if (flipped){
                push(p.vertices[i + 2], n)
                push(p.vertices[i + 1], n)
            } else {
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
