var G = require('../../geometry'),
    Vertex = G.Vertex,
    Vector3D = G.Vertex3D,
    Polygon = G.Polygon,
    Connector = require('../Connector'),
    Properties = require('../Properties'),
    optionParser = require('../../util/optionParser'),
    CSG = require('../CSG'),
    config = require('../../config')

// Construct a solid cylinder.
//
// Parameters:
//   start: start point of cylinder (default [0, -1, 0])
//   end: end point of cylinder (default [0, 1, 0])
//   radius: radius of cylinder (default 1), must be a scalar
//   resolution: determines the number of polygons per 360 degree revolution (default 12)
//
// Example usage:
//
//     var cylinder = cylinder({
//       start: [0, -1, 0],
//       end: [0, 1, 0],
//       radius: 1,
//       resolution: 16
//     });
function cylinder(options) {
    var s = optionParser.parseAs3DVector(options, "start", [0, -1, 0]);
    var e = optionParser.parseAs3DVector(options, "end", [0, 1, 0]);
    var r = optionParser.parseAsFloat(options, "radius", 1);
    var rEnd = optionParser.parseAsFloat(options, "radiusEnd", r);
    var rStart = optionParser.parseAsFloat(options, "radiusStart", r);

    if ((rEnd < 0) || (rStart < 0)) {
        throw new Error("Radius should be non-negative");
    }
    if ((rEnd === 0) && (rStart === 0)) {
        throw new Error("Either radiusStart or radiusEnd should be positive");
    }

    var slices = optionParser.parseAsInt(options, "resolution", config.defaultResolution2D);
    var ray = e.minus(s);
    var axisZ = ray.unit(); //, isY = (Math.abs(axisZ.y) > 0.5);
    var axisX = axisZ.randomNonParallelVector().unit();

    //  var axisX = new Vector3D(isY, !isY, 0).cross(axisZ).unit();
    var axisY = axisX.cross(axisZ).unit();
    var start = new Vertex(s);
    var end = new Vertex(e);
    var polygons = [];

    function point(stack, slice, radius) {
        var angle = slice * Math.PI * 2;
        var out = axisX.times(Math.cos(angle)).plus(axisY.times(Math.sin(angle)));
        var pos = s.plus(ray.times(stack)).plus(out.times(radius));
        return new Vertex(pos);
    }
    for (var i = 0; i < slices; i++) {
        var t0 = i / slices,
            t1 = (i + 1) / slices;
        if (rEnd == rStart) {
            polygons.push(new Polygon([start, point(0, t0, rEnd), point(0, t1, rEnd)]));
            polygons.push(new Polygon([point(0, t1, rEnd), point(0, t0, rEnd), point(1, t0, rEnd), point(1, t1, rEnd)]));
            polygons.push(new Polygon([end, point(1, t1, rEnd), point(1, t0, rEnd)]));
        } else {
            if (rStart > 0) {
                polygons.push(new Polygon([start, point(0, t0, rStart), point(0, t1, rStart)]));
                polygons.push(new Polygon([point(0, t0, rStart), point(1, t0, rEnd), point(0, t1, rStart)]));
            }
            if (rEnd > 0) {
                polygons.push(new Polygon([end, point(1, t1, rEnd), point(1, t0, rEnd)]));
                polygons.push(new Polygon([point(1, t0, rEnd), point(1, t1, rEnd), point(0, t1, rStart)]));
            }
        }
    }
    var result = CSG.fromPolygons(polygons);
    result.properties.cylinder = new Properties();
    result.properties.cylinder.start = new Connector(s, axisZ.negated(), axisX);
    result.properties.cylinder.end = new Connector(e, axisZ, axisX);
    result.properties.cylinder.facepoint = s.plus(axisX.times(rStart));
    return result;
};

module.exports = cylinder
