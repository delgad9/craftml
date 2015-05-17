// Like a cylinder, but with rounded ends instead of flat
//
// Parameters:
//   start: start point of cylinder (default [0, -1, 0])
//   end: end point of cylinder (default [0, 1, 0])
//   radius: radius of cylinder (default 1), must be a scalar
//   resolution: determines the number of polygons per 360 degree revolution (default 12)
//   normal: a vector determining the starting angle for tesselation. Should be non-parallel to start.minus(end)
//
// Example usage:
//
//     var cylinder = CSG.roundedCylinder({
//       start: [0, -1, 0],
//       end: [0, 1, 0],
//       radius: 1,
//       resolution: 16
//     });

var G = require('../../geometry'),
    Connector = require('../Connector'),
    Properties = require('../Properties'),
    optionParser = require('../../util/optionParser'),
    CSG = require('../CSG'),
    config = require('../../config')

module.exports = function roundedCylinder(options) {
    var p1 = optionParser.parseAs3DVector(options, "start", [0, -1, 0]);
    var p2 = optionParser.parseAs3DVector(options, "end", [0, 1, 0]);
    var radius = optionParser.parseAsFloat(options, "radius", 1);
    var direction = p2.minus(p1);
    var defaultnormal;
    if (Math.abs(direction.x) > Math.abs(direction.y)) {
        defaultnormal = new G.Vector3D(0, 1, 0);
    } else {
        defaultnormal = new G.Vector3D(1, 0, 0);
    }
    var normal = optionParser.parseAs3DVector(options, "normal", defaultnormal);
    var resolution = optionParser.parseAsInt(options, "resolution", config.defaultResolution3D);
    if (resolution < 4) resolution = 4;
    var polygons = [];
    var qresolution = Math.floor(0.25 * resolution);
    var length = direction.length();
    if (length < 1e-10) {
        return CSG.sphere({
            center: p1,
            radius: radius,
            resolution: resolution
        });
    }
    var zvector = direction.unit().times(radius);
    var xvector = zvector.cross(normal).unit().times(radius);
    var yvector = xvector.cross(zvector).unit().times(radius);
    var prevcylinderpoint;
    for (var slice1 = 0; slice1 <= resolution; slice1++) {
        var angle = Math.PI * 2.0 * slice1 / resolution;
        var cylinderpoint = xvector.times(Math.cos(angle)).plus(yvector.times(Math.sin(angle)));
        if (slice1 > 0) {
            // cylinder vertices:
            var vertices = [];
            vertices.push(new G.Vertex(p1.plus(cylinderpoint)));
            vertices.push(new G.Vertex(p1.plus(prevcylinderpoint)));
            vertices.push(new G.Vertex(p2.plus(prevcylinderpoint)));
            vertices.push(new G.Vertex(p2.plus(cylinderpoint)));
            polygons.push(new G.Polygon(vertices));
            var prevcospitch, prevsinpitch;
            for (var slice2 = 0; slice2 <= qresolution; slice2++) {
                var pitch = 0.5 * Math.PI * slice2 / qresolution;
                //var pitch = Math.asin(slice2/qresolution);
                var cospitch = Math.cos(pitch);
                var sinpitch = Math.sin(pitch);
                if (slice2 > 0) {
                    vertices = [];
                    vertices.push(new G.Vertex(p1.plus(prevcylinderpoint.times(prevcospitch).minus(zvector.times(prevsinpitch)))));
                    vertices.push(new G.Vertex(p1.plus(cylinderpoint.times(prevcospitch).minus(zvector.times(prevsinpitch)))));
                    if (slice2 < qresolution) {
                        vertices.push(new Vertex(p1.plus(cylinderpoint.times(cospitch).minus(zvector.times(sinpitch)))));
                    }
                    vertices.push(new G.Vertex(p1.plus(prevcylinderpoint.times(cospitch).minus(zvector.times(sinpitch)))));
                    polygons.push(new G.Polygon(vertices));
                    vertices = [];
                    vertices.push(new G.Vertex(p2.plus(prevcylinderpoint.times(prevcospitch).plus(zvector.times(prevsinpitch)))));
                    vertices.push(new G.Vertex(p2.plus(cylinderpoint.times(prevcospitch).plus(zvector.times(prevsinpitch)))));
                    if (slice2 < qresolution) {
                        vertices.push(new G.Vertex(p2.plus(cylinderpoint.times(cospitch).plus(zvector.times(sinpitch)))));
                    }
                    vertices.push(new G.Vertex(p2.plus(prevcylinderpoint.times(cospitch).plus(zvector.times(sinpitch)))));
                    vertices.reverse();
                    polygons.push(new G.Polygon(vertices));
                }
                prevcospitch = cospitch;
                prevsinpitch = sinpitch;
            }
        }
        prevcylinderpoint = cylinderpoint;
    }
    var result = CSG.fromPolygons(polygons);
    var ray = zvector.unit();
    var axisX = xvector.unit();
    result.properties.roundedCylinder = new Properties();
    result.properties.roundedCylinder.start = new Connector(p1, ray.negated(), axisX);
    result.properties.roundedCylinder.end = new Connector(p2, ray, axisX);
    result.properties.roundedCylinder.facepoint = p1.plus(xvector);
    return result;
};
