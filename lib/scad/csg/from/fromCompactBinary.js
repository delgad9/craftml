var Vertex = require('../geometry/Vertex'),
    Vector3D = require('../geometry/Vector3D'),
    Polygon = require('../geometry/Polygon'),
    fromPolygons = require('./fromPolygons')

// Reconstruct a CSG from the output of toCompactBinary()
module.exports = function fromCompactBinary(bin) {

    if (bin['class'] != "CSG") throw new Error("Not a CSG");
    var planes = [],
        planeData = bin.planeData,
        numplanes = planeData.length / 4,
        arrayindex = 0,
        x, y, z, w, normal, plane;
    for (var planeindex = 0; planeindex < numplanes; planeindex++) {
        x = planeData[arrayindex++];
        y = planeData[arrayindex++];
        z = planeData[arrayindex++];
        w = planeData[arrayindex++];
        normal = new Vector3D(x, y, z);
        plane = new Plane(normal, w);
        planes.push(plane);
    }

    var vertices = [],
        vertexData = bin.vertexData,
        numvertices = vertexData.length / 3,
        pos, vertex;
    arrayindex = 0;
    for (var vertexindex = 0; vertexindex < numvertices; vertexindex++) {
        x = vertexData[arrayindex++];
        y = vertexData[arrayindex++];
        z = vertexData[arrayindex++];
        pos = new Vector3D(x, y, z);
        vertex = new Vertex(pos);
        vertices.push(vertex);
    }

    var shareds = bin.shared.map(function(shared) {
        return Polygon.Shared.fromObject(shared);
    });

    var polygons = [],
        numpolygons = bin.numPolygons,
        numVerticesPerPolygon = bin.numVerticesPerPolygon,
        polygonVertices = bin.polygonVertices,
        polygonPlaneIndexes = bin.polygonPlaneIndexes,
        polygonSharedIndexes = bin.polygonSharedIndexes,
        numpolygonvertices, polygonvertices, shared, polygon; //already defined plane,
    arrayindex = 0;
    for (var polygonindex = 0; polygonindex < numpolygons; polygonindex++) {
        numpolygonvertices = numVerticesPerPolygon[polygonindex];
        polygonvertices = [];
        for (var i = 0; i < numpolygonvertices; i++) {
            polygonvertices.push(vertices[polygonVertices[arrayindex++]]);
        }
        plane = planes[polygonPlaneIndexes[polygonindex]];
        shared = shareds[polygonSharedIndexes[polygonindex]];
        polygon = new Polygon(polygonvertices, shared, plane);
        polygons.push(polygon);
    }
    var csg = fromPolygons(polygons);
    csg.isCanonicalized = true;
    csg.isRetesselated = true;
    return csg;
}
