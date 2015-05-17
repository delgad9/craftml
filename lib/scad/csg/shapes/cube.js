// Construct an axis-aligned solid cuboid.
// Parameters:
//   center: center of cube (default [0,0,0])
//   radius: radius of cube (default [1,1,1]), can be specified as scalar or as 3D vector
//
// Example code:
//
//     var cube = cube({
//       center: [0, 0, 0],
//       radius: 1
//     });

var G = require('../../geometry'),
    Connector = require('../Connector'),
    Properties = require('../Properties'),
    optionParser = require('../util/optionParser'),
    CSG = require('../CSG')

module.exports = function cube(options) {
    var c = optionParser.parseAs3DVector(options, "center", [0, 0, 0]);
    var r = optionParser.parseAs3DVector(options, "radius", [1, 1, 1]);
    var result = CSG.fromPolygons([
        [
            [0, 4, 6, 2],
            [-1, 0, 0]
        ],
        [
            [1, 3, 7, 5],
            [+1, 0, 0]
        ],
        [
            [0, 1, 5, 4],
            [0, -1, 0]
        ],
        [
            [2, 6, 7, 3],
            [0, +1, 0]
        ],
        [
            [0, 2, 3, 1],
            [0, 0, -1]
        ],
        [
            [4, 5, 7, 6],
            [0, 0, +1]
        ]
    ].map(function(info) {
        //var normal = new Vector3D(info[1]);
        //var plane = new Plane(normal, 1);
        var vertices = info[0].map(function(i) {
            var pos = new G.Vector3D(
                c.x + r.x * (2 * !!(i & 1) - 1), c.y + r.y * (2 * !!(i & 2) - 1), c.z + r.z * (2 * !!(i & 4) - 1));
            return new G.Vertex(pos);
        });
        return new G.Polygon(vertices, null /* , plane */ );
    }));
    result.properties.cube = new Properties();
    result.properties.cube.center = new G.Vector3D(c);
    result.properties.cube.corners = [
        new G.Vector3D([-r.x, r.y, r.z]).plus(c),
        new G.Vector3D([r.x, r.y, r.z]).plus(c),
        new G.Vector3D([r.x, -r.y, r.z]).plus(c),
        new G.Vector3D([-r.x, -r.y, r.z]).plus(c),
        new G.Vector3D([-r.x, r.y, -r.z]).plus(c),
        new G.Vector3D([r.x, r.y, -r.z]).plus(c),
        new G.Vector3D([r.x, -r.y, -r.z]).plus(c),
        new G.Vector3D([-r.x, -r.y, -r.z]).plus(c)
    ];
    // add 6 connectors, at the centers of each face:
    result.properties.cube.facecenters = [
        new Connector(new G.Vector3D([r.x, 0, 0]).plus(c), [1, 0, 0], [0, 0, 1]),
        new Connector(new G.Vector3D([-r.x, 0, 0]).plus(c), [-1, 0, 0], [0, 0, 1]),
        new Connector(new G.Vector3D([0, r.y, 0]).plus(c), [0, 1, 0], [0, 0, 1]),
        new Connector(new G.Vector3D([0, -r.y, 0]).plus(c), [0, -1, 0], [0, 0, 1]),
        new Connector(new G.Vector3D([0, 0, r.z]).plus(c), [0, 0, 1], [1, 0, 0]),
        new Connector(new G.Vector3D([0, 0, -r.z]).plus(c), [0, 0, -1], [1, 0, 0])
    ];

    return result;
}
