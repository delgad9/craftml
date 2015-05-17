// For debugging
// Creates a new solid with a tiny cube at every vertex of the source solid
module.exports = function toPointCloud(cuberadius) {
    var cube = require('../shapes/cube')
    var csg = this.reTesselated();

    var result = null

    // make a list of all unique vertices
    // For each vertex we also collect the list of normals of the planes touching the vertices
    var vertexmap = {};
    csg.polygons.map(function(polygon) {
        polygon.vertices.map(function(vertex) {
            vertexmap[vertex.getTag()] = vertex.pos;
        });
    });

    for(var vertextag in vertexmap) {
        var pos = vertexmap[vertextag];
        var c = cube({
            center: pos,
            radius: cuberadius
        });
        if (result){
            result = result.unionSub(c, false, false);
        } else {
            result = c
        }
    }

    result = result.reTesselated();
    return result;
}
