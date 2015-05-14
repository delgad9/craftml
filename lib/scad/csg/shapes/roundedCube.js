// Construct an axis-aligned solid rounded cuboid.
// Parameters:
//   center: center of cube (default [0,0,0])
//   radius: radius of cube (default [1,1,1]), can be specified as scalar or as 3D vector
//   roundradius: radius of rounded corners (default 0.2), must be a scalar
//   resolution: determines the number of polygons per 360 degree revolution (default 8)
//
// Example code:
//
//     var cube = roundedCube({
//       center: [0, 0, 0],
//       radius: 1,
//       roundradius: 0.2,
//       resolution: 8,
//     });
var Vertex = require('../Vertex'),
    Vector3D = require('../Vector3D'),
    Polygon = require('../Polygon'),
    Connector = require('../Connector'),
    Properties = require('../Properties'),
    optionParser = require('../util/optionParser'),
    CSG = require('../CSG'),
    config = require('./config')
    cube = require('./cube'),
    sphere = require('./sphere'),
    cylinder = require('./cylinder')

module.exports = function roundedCube(options) {
    var center = optionParser.parseAs3DVector(options, "center", [0, 0, 0]);
    var cuberadius = optionParser.parseAs3DVector(options, "radius", [1, 1, 1]);
    var resolution = optionParser.parseAsInt(options, "resolution", config.defaultResolution3D);
    if (resolution < 4) resolution = 4;
    var roundradius = optionParser.parseAsFloat(options, "roundradius", 0.2);
    var innercuberadius = cuberadius;
    innercuberadius = innercuberadius.minus(new Vector3D(roundradius));
    var result = cube({
        center: center,
        radius: [cuberadius.x, innercuberadius.y, innercuberadius.z]
    });
    result = result.unionSub(cube({
        center: center,
        radius: [innercuberadius.x, cuberadius.y, innercuberadius.z]
    }), false, false);
    result = result.unionSub(cube({
        center: center,
        radius: [innercuberadius.x, innercuberadius.y, cuberadius.z]
    }), false, false);
    for (var level = 0; level < 2; level++) {
        var z = innercuberadius.z;
        if (level == 1) z = -z;
        var p1 = new Vector3D(innercuberadius.x, innercuberadius.y, z).plus(center);
        var p2 = new Vector3D(innercuberadius.x, -innercuberadius.y, z).plus(center);
        var p3 = new Vector3D(-innercuberadius.x, -innercuberadius.y, z).plus(center);
        var p4 = new Vector3D(-innercuberadius.x, innercuberadius.y, z).plus(center);
        var s = sphere({
            center: p1,
            radius: roundradius,
            resolution: resolution
        });
        result = result.unionSub(s, false, false);
        s = sphere({
            center: p2,
            radius: roundradius,
            resolution: resolution
        });
        result = result.unionSub(s, false, false);
        s = sphere({
            center: p3,
            radius: roundradius,
            resolution: resolution
        });
        result = result.unionSub(s, false, false);
        s = sphere({
            center: p4,
            radius: roundradius,
            resolution: resolution
        });
        result = result.unionSub(s, false, true);
        var c = cylinder({
            start: p1,
            end: p2,
            radius: roundradius,
            resolution: resolution
        });
        result = result.unionSub(c, false, false);
        c = cylinder({
            start: p2,
            end: p3,
            radius: roundradius,
            resolution: resolution
        });
        result = result.unionSub(c, false, false);
        c = cylinder({
            start: p3,
            end: p4,
            radius: roundradius,
            resolution: resolution
        });
        result = result.unionSub(c, false, false);
        c = cylinder({
            start: p4,
            end: p1,
            radius: roundradius,
            resolution: resolution
        });
        result = result.unionSub(c, false, false);
        if (level === 0) {
            var d = new Vector3D(0, 0, -2 * z);
            c = cylinder({
                start: p1,
                end: p1.plus(d),
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(c);
            c = cylinder({
                start: p2,
                end: p2.plus(d),
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(c);
            c = cylinder({
                start: p3,
                end: p3.plus(d),
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(c);
            c = cylinder({
                start: p4,
                end: p4.plus(d),
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(c, false, true);
        }
    }
    result = result.reTesselated();
    result.properties.roundedCube = new Properties();
    result.properties.roundedCube.center = new Vertex(center);
    result.properties.roundedCube.facecenters = [
        new Connector(new Vector3D([cuberadius.x, 0, 0]).plus(center), [1, 0, 0], [0, 0, 1]),
        new Connector(new Vector3D([-cuberadius.x, 0, 0]).plus(center), [-1, 0, 0], [0, 0, 1]),
        new Connector(new Vector3D([0, cuberadius.y, 0]).plus(center), [0, 1, 0], [0, 0, 1]),
        new Connector(new Vector3D([0, -cuberadius.y, 0]).plus(center), [0, -1, 0], [0, 0, 1]),
        new Connector(new Vector3D([0, 0, cuberadius.z]).plus(center), [0, 0, 1], [1, 0, 0]),
        new Connector(new Vector3D([0, 0, -cuberadius.z]).plus(center), [0, 0, -1], [1, 0, 0])
    ];
    return result;
}
