module.exports = function toFloat32Array() {

    var numvertices = 0
    this.polygons.forEach(function(p) {
        numvertices += (p.vertices.length - 2) * 3
    })
    var vertexData = new Float32Array(numvertices * 3)

    // planeData = new Float64Array(numplanes * 4),
    // polygonVerticesIndex = 0;
    // for (var polygonindex = 0; polygonindex < numpolygons; ++polygonindex) {
    //     var p = csg.polygons[polygonindex];
    //     numVerticesPerPolygon[polygonindex] = p.vertices.length;
    //     p.vertices.map(function(v) {
    //         var vertextag = v.getTag();
    //         var vertexindex = vertexmap[vertextag];
    //         polygonVertices[polygonVerticesIndex++] = vertexindex;
    //     });
    //     var planetag = p.plane.getTag();
    //     var planeindex = planemap[planetag];
    //     polygonPlaneIndexes[polygonindex] = planeindex;
    //     var sharedtag = p.shared.getTag();
    //     var sharedindex = sharedmap[sharedtag];
    //     polygonSharedIndexes[polygonindex] = sharedindex;
    // }
    var verticesArrayIndex = 0
    function push(vertex){
        var pos = vertex.pos;
        vertexData[verticesArrayIndex++] = pos._x;
        vertexData[verticesArrayIndex++] = pos._y;
        vertexData[verticesArrayIndex++] = pos._z;
    }

    this.polygons.forEach(function(p) {
            //numvertices += p.vertices.length

            var firstVertex = p.vertices[0]

            // p.vertices.forEach(function(v) {
            //     var pos = v.pos;
            //     vertexData[verticesArrayIndex++] = pos._x;
            //     vertexData[verticesArrayIndex++] = pos._y;
            //     vertexData[verticesArrayIndex++] = pos._z;
            // })

            for (var i = 0; i < p.vertices.length - 2; i++) {
                push(firstVertex)
                push(p.vertices[i + 1])
                push(p.vertices[i + 2])
            }
        })

    return vertexData
}
