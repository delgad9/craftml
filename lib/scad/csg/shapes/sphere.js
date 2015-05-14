var Vertex = require('../Vertex'),
    Vector3D = require('../Vector3D'),
    Polygon = require('../Polygon'),
    Connector = require('../Connector'),
    Properties = require('../Properties'),
    optionParser = require('../util/optionParser'),
    CSG = require('../CSG')
    config = require('./config')

// Construct a solid sphere
//
// Parameters:
//   center: center of sphere (default [0,0,0])
//   radius: radius of sphere (default 1), must be a scalar
//   resolution: determines the number of polygons per 360 degree revolution (default 12)
//   axes: (optional) an array with 3 vectors for the x, y and z base vectors
//
// Example usage:
//
//     var sphere = sphere({
//       center: [0, 0, 0],
//       radius: 2,
//       resolution: 32,
//     });
module.exports = function sphere(options) {
    options = options || {};
    var center = optionParser.parseAs3DVector(options, "center", [0, 0, 0]);
    var radius = optionParser.parseAsFloat(options, "radius", 1);
    var resolution = optionParser.parseAsInt(options, "resolution", config.defaultResolution3D);
    var xvector, yvector, zvector;
    if ('axes' in options) {
        xvector = options.axes[0].unit().times(radius);
        yvector = options.axes[1].unit().times(radius);
        zvector = options.axes[2].unit().times(radius);
    } else {
        xvector = new Vector3D([1, 0, 0]).times(radius);
        yvector = new Vector3D([0, -1, 0]).times(radius);
        zvector = new Vector3D([0, 0, 1]).times(radius);
    }
    if (resolution < 4) resolution = 4;
    var qresolution = Math.round(resolution / 4);
    var prevcylinderpoint;
    var polygons = [];
    for (var slice1 = 0; slice1 <= resolution; slice1++) {
        var angle = Math.PI * 2.0 * slice1 / resolution;
        var cylinderpoint = xvector.times(Math.cos(angle)).plus(yvector.times(Math.sin(angle)));
        if (slice1 > 0) {
            // cylinder vertices:
            var vertices = [];
            var prevcospitch, prevsinpitch;
            for (var slice2 = 0; slice2 <= qresolution; slice2++) {
                var pitch = 0.5 * Math.PI * slice2 / qresolution;
                var cospitch = Math.cos(pitch);
                var sinpitch = Math.sin(pitch);
                if (slice2 > 0) {
                    vertices = [];
                    vertices.push(new Vertex(center.plus(prevcylinderpoint.times(prevcospitch).minus(zvector.times(prevsinpitch)))));
                    vertices.push(new Vertex(center.plus(cylinderpoint.times(prevcospitch).minus(zvector.times(prevsinpitch)))));
                    if (slice2 < qresolution) {
                        vertices.push(new Vertex(center.plus(cylinderpoint.times(cospitch).minus(zvector.times(sinpitch)))));
                    }
                    vertices.push(new Vertex(center.plus(prevcylinderpoint.times(cospitch).minus(zvector.times(sinpitch)))));
                    polygons.push(new Polygon(vertices));
                    vertices = [];
                    vertices.push(new Vertex(center.plus(prevcylinderpoint.times(prevcospitch).plus(zvector.times(prevsinpitch)))));
                    vertices.push(new Vertex(center.plus(cylinderpoint.times(prevcospitch).plus(zvector.times(prevsinpitch)))));
                    if (slice2 < qresolution) {
                        vertices.push(new Vertex(center.plus(cylinderpoint.times(cospitch).plus(zvector.times(sinpitch)))));
                    }
                    vertices.push(new Vertex(center.plus(prevcylinderpoint.times(cospitch).plus(zvector.times(sinpitch)))));
                    vertices.reverse();
                    polygons.push(new Polygon(vertices));
                }
                prevcospitch = cospitch;
                prevsinpitch = sinpitch;
            }
        }
        prevcylinderpoint = cylinderpoint;
    }
    var result = CSG.fromPolygons(polygons);
    result.properties.sphere = new Properties();
    result.properties.sphere.center = new Vector3D(center);
    result.properties.sphere.facepoint = center.plus(xvector);
    return result;
}
