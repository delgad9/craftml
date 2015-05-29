module.exports = function toFloat32ArrayLines() {
    // assume the lines are stored in the first polygon
    var numvertices = 0
    numvertices = this.polygons[0].vertices.length
    numvertices += 1

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
            var n = p.plane.normal
            for (var i = 0; i < p.vertices.length; i++) {
                push(p.vertices[i], n)
            }
            var firstVertex = p.vertices[0]
            push(firstVertex, n)
        })
    return {
        vertices: vertexData,
        normals: normalData
    }
}
