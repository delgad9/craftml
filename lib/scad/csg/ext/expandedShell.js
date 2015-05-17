// Create the expanded shell of the solid:
// All faces are extruded to get a thickness of 2*radius
// Cylinders are constructed around every side
// Spheres are placed on every vertex
// unionWithThis: if true, the resulting solid will be united with 'this' solid;
//   the result is a true expansion of the solid
//   If false, returns only the shell

var CSG = require('../CSG')

function fnNumberSort(a, b) {
	return a - b;
}

module.exports = function expandedShell(radius, resolution, unionWithThis) {
    
    var csg = this.reTesselated();
    var result;
    if(unionWithThis) {
        result = csg;
    } else {
        result = new CSG();
    }

    // first extrude all polygons:
    csg.polygons.map(function(polygon) {
        var extrudevector = polygon.plane.normal.unit().times(2 * radius);
        var translatedpolygon = polygon.translate(extrudevector.times(-0.5));
        var extrudedface = translatedpolygon.extrude(extrudevector);
        result = result.unionSub(extrudedface, false, false);
    });

    // Make a list of all unique vertex pairs (i.e. all sides of the solid)
    // For each vertex pair we collect the following:
    //   v1: first coordinate
    //   v2: second coordinate
    //   planenormals: array of normal vectors of all planes touching this side
    var vertexpairs = {}; // map of 'vertex pair tag' to {v1, v2, planenormals}
    csg.polygons.map(function(polygon) {
        var numvertices = polygon.vertices.length;
        var prevvertex = polygon.vertices[numvertices - 1];
        var prevvertextag = prevvertex.getTag();
        for(var i = 0; i < numvertices; i++) {
            var vertex = polygon.vertices[i];
            var vertextag = vertex.getTag();
            var vertextagpair;
            if(vertextag < prevvertextag) {
                vertextagpair = vertextag + "-" + prevvertextag;
            } else {
                vertextagpair = prevvertextag + "-" + vertextag;
            }
            var obj;
            if(vertextagpair in vertexpairs) {
                obj = vertexpairs[vertextagpair];
            } else {
                obj = {
                    v1: prevvertex,
                    v2: vertex,
                    planenormals: []
                };
                vertexpairs[vertextagpair] = obj;
            }
            obj.planenormals.push(polygon.plane.normal);

            prevvertextag = vertextag;
            prevvertex = vertex;
        }
    });

    // now construct a cylinder on every side
    // The cylinder is always an approximation of a true cylinder: it will have <resolution> polygons
    // around the sides. We will make sure though that the cylinder will have an edge at every
    // face that touches this side. This ensures that we will get a smooth fill even
    // if two edges are at, say, 10 degrees and the resolution is low.
    // Note: the result is not retesselated yet but it really should be!
    for(var vertextagpair in vertexpairs) {
        var vertexpair = vertexpairs[vertextagpair],
            startpoint = vertexpair.v1.pos,
            endpoint = vertexpair.v2.pos,
        // our x,y and z vectors:
            zbase = endpoint.minus(startpoint).unit(),
            xbase = vertexpair.planenormals[0].unit(),
            ybase = xbase.cross(zbase),

        // make a list of angles that the cylinder should traverse:
            angles = [];

        // first of all equally spaced around the cylinder:
        for(var i = 0; i < resolution; i++) {
            angles.push(i * Math.PI * 2 / resolution);
        }

        // and also at every normal of all touching planes:
        for(var i = 0, iMax = vertexpair.planenormals.length; i < iMax; i++) {
            var planenormal = vertexpair.planenormals[i],
                si = ybase.dot(planenormal),
                co = xbase.dot(planenormal),
                angle = Math.atan2(si, co);

            if(angle < 0) angle += Math.PI * 2;
            angles.push(angle);
            angle = Math.atan2(-si, -co);
            if(angle < 0) angle += Math.PI * 2;
            angles.push(angle);
        }

        // this will result in some duplicate angles but we will get rid of those later.
        // Sort:
        angles = angles.sort(fnNumberSort);

        // Now construct the cylinder by traversing all angles:
        var numangles = angles.length,
            prevp1, prevp2,
            startfacevertices = [],
            endfacevertices = [],
            polygons = [];
        for(var i = -1; i < numangles; i++) {
            var angle = angles[(i < 0) ? (i + numangles) : i],
                si = Math.sin(angle),
                co = Math.cos(angle),
                p = xbase.times(co * radius).plus(ybase.times(si * radius)),
                p1 = startpoint.plus(p),
                p2 = endpoint.plus(p),
                skip = false;
            if(i >= 0) {
                if(p1.distanceTo(prevp1) < 1e-5) {
                    skip = true;
                }
            }
            if(!skip) {
                if(i >= 0) {
                    startfacevertices.push(new CSG.Vertex(p1));
                    endfacevertices.push(new CSG.Vertex(p2));
                    var polygonvertices = [
                        new CSG.Vertex(prevp2),
                        new CSG.Vertex(p2),
                        new CSG.Vertex(p1),
                        new CSG.Vertex(prevp1)];
                    var polygon = new CSG.Polygon(polygonvertices);
                    polygons.push(polygon);
                }
                prevp1 = p1;
                prevp2 = p2;
            }
        }
        endfacevertices.reverse();
        polygons.push(new CSG.Polygon(startfacevertices));
        polygons.push(new CSG.Polygon(endfacevertices));
        var cylinder = CSG.fromPolygons(polygons);
        result = result.unionSub(cylinder, false, false);
    }

    // make a list of all unique vertices
    // For each vertex we also collect the list of normals of the planes touching the vertices
    var vertexmap = {};
    csg.polygons.map(function(polygon) {
        polygon.vertices.map(function(vertex) {
            var vertextag = vertex.getTag();
            var obj;
            if(vertextag in vertexmap) {
                obj = vertexmap[vertextag];
            } else {
                obj = {
                    pos: vertex.pos,
                    normals: []
                };
                vertexmap[vertextag] = obj;
            }
            obj.normals.push(polygon.plane.normal);
        });
    });

    // and build spheres at each vertex
    // We will try to set the x and z axis to the normals of 2 planes
    // This will ensure that our sphere tesselation somewhat matches 2 planes
    for(var vertextag in vertexmap) {
        var vertexobj = vertexmap[vertextag];
        // use the first normal to be the x axis of our sphere:
        var xaxis = vertexobj.normals[0].unit();
        // and find a suitable z axis. We will use the normal which is most perpendicular to the x axis:
        var bestzaxis = null;
        var bestzaxisorthogonality = 0;
        for(var i = 1; i < vertexobj.normals.length; i++) {
            var normal = vertexobj.normals[i].unit();
            var cross = xaxis.cross(normal);
            var crosslength = cross.length();
            if(crosslength > 0.05) {
                if(crosslength > bestzaxisorthogonality) {
                    bestzaxisorthogonality = crosslength;
                    bestzaxis = normal;
                }
            }
        }
        if(!bestzaxis) {
            bestzaxis = xaxis.randomNonParallelVector();
        }
        var yaxis = xaxis.cross(bestzaxis).unit();
        var zaxis = yaxis.cross(xaxis);
        var sphere = CSG.sphere({
            center: vertexobj.pos,
            radius: radius,
            resolution: resolution,
            axes: [xaxis, yaxis, zaxis]
        });
        result = result.unionSub(sphere, false, false);
    }

    return result;
}
