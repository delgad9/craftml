module.exports = function(CSG) {

    // Construct an axis-aligned solid cuboid.
    // Parameters:
    //   center: center of cube (default [0,0,0])
    //   radius: radius of cube (default [1,1,1]), can be specified as scalar or as 3D vector
    //
    // Example code:
    //
    //     var cube = CSG.cube({
    //       center: [0, 0, 0],
    //       radius: 1
    //     });
    CSG.cube = function(options) {
        var c = CSG.parseOptionAs3DVector(options, "center", [0, 0, 0]);
        var r = CSG.parseOptionAs3DVector(options, "radius", [1, 1, 1]);
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
            //var normal = new CSG.Vector3D(info[1]);
            //var plane = new CSG.Plane(normal, 1);
            var vertices = info[0].map(function(i) {
                var pos = new CSG.Vector3D(
                    c.x + r.x * (2 * !!(i & 1) - 1), c.y + r.y * (2 * !!(i & 2) - 1), c.z + r.z * (2 * !!(i & 4) - 1));
                return new CSG.Vertex(pos);
            });
            return new CSG.Polygon(vertices, null /* , plane */ );
        }));
        result.properties.cube = new CSG.Properties();
        result.properties.cube.center = new CSG.Vector3D(c);
        result.properties.cube.corners = [
            new CSG.Vector3D([-r.x, r.y, r.z]).plus(c),
            new CSG.Vector3D([r.x, r.y, r.z]).plus(c),
            new CSG.Vector3D([r.x, -r.y, r.z]).plus(c),
            new CSG.Vector3D([-r.x, -r.y, r.z]).plus(c),
            new CSG.Vector3D([-r.x, r.y, -r.z]).plus(c),
            new CSG.Vector3D([r.x, r.y, -r.z]).plus(c),
            new CSG.Vector3D([r.x, -r.y, -r.z]).plus(c),
            new CSG.Vector3D([-r.x, -r.y, -r.z]).plus(c)
        ];
        // add 6 connectors, at the centers of each face:
        result.properties.cube.facecenters = [
            new CSG.Connector(new CSG.Vector3D([r.x, 0, 0]).plus(c), [1, 0, 0], [0, 0, 1]),
            new CSG.Connector(new CSG.Vector3D([-r.x, 0, 0]).plus(c), [-1, 0, 0], [0, 0, 1]),
            new CSG.Connector(new CSG.Vector3D([0, r.y, 0]).plus(c), [0, 1, 0], [0, 0, 1]),
            new CSG.Connector(new CSG.Vector3D([0, -r.y, 0]).plus(c), [0, -1, 0], [0, 0, 1]),
            new CSG.Connector(new CSG.Vector3D([0, 0, r.z]).plus(c), [0, 0, 1], [1, 0, 0]),
            new CSG.Connector(new CSG.Vector3D([0, 0, -r.z]).plus(c), [0, 0, -1], [1, 0, 0])
        ];

        return result;
    };

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
    //     var sphere = CSG.sphere({
    //       center: [0, 0, 0],
    //       radius: 2,
    //       resolution: 32,
    //     });
    CSG.sphere = function(options) {
        options = options || {};
        var center = CSG.parseOptionAs3DVector(options, "center", [0, 0, 0]);
        var radius = CSG.parseOptionAsFloat(options, "radius", 1);
        var resolution = CSG.parseOptionAsInt(options, "resolution", CSG.defaultResolution3D);
        var xvector, yvector, zvector;
        if ('axes' in options) {
            xvector = options.axes[0].unit().times(radius);
            yvector = options.axes[1].unit().times(radius);
            zvector = options.axes[2].unit().times(radius);
        } else {
            xvector = new CSG.Vector3D([1, 0, 0]).times(radius);
            yvector = new CSG.Vector3D([0, -1, 0]).times(radius);
            zvector = new CSG.Vector3D([0, 0, 1]).times(radius);
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
                        vertices.push(new CSG.Vertex(center.plus(prevcylinderpoint.times(prevcospitch).minus(zvector.times(prevsinpitch)))));
                        vertices.push(new CSG.Vertex(center.plus(cylinderpoint.times(prevcospitch).minus(zvector.times(prevsinpitch)))));
                        if (slice2 < qresolution) {
                            vertices.push(new CSG.Vertex(center.plus(cylinderpoint.times(cospitch).minus(zvector.times(sinpitch)))));
                        }
                        vertices.push(new CSG.Vertex(center.plus(prevcylinderpoint.times(cospitch).minus(zvector.times(sinpitch)))));
                        polygons.push(new CSG.Polygon(vertices));
                        vertices = [];
                        vertices.push(new CSG.Vertex(center.plus(prevcylinderpoint.times(prevcospitch).plus(zvector.times(prevsinpitch)))));
                        vertices.push(new CSG.Vertex(center.plus(cylinderpoint.times(prevcospitch).plus(zvector.times(prevsinpitch)))));
                        if (slice2 < qresolution) {
                            vertices.push(new CSG.Vertex(center.plus(cylinderpoint.times(cospitch).plus(zvector.times(sinpitch)))));
                        }
                        vertices.push(new CSG.Vertex(center.plus(prevcylinderpoint.times(cospitch).plus(zvector.times(sinpitch)))));
                        vertices.reverse();
                        polygons.push(new CSG.Polygon(vertices));
                    }
                    prevcospitch = cospitch;
                    prevsinpitch = sinpitch;
                }
            }
            prevcylinderpoint = cylinderpoint;
        }
        var result = CSG.fromPolygons(polygons);
        result.properties.sphere = new CSG.Properties();
        result.properties.sphere.center = new CSG.Vector3D(center);
        result.properties.sphere.facepoint = center.plus(xvector);
        return result;
    };

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
    //     var cylinder = CSG.cylinder({
    //       start: [0, -1, 0],
    //       end: [0, 1, 0],
    //       radius: 1,
    //       resolution: 16
    //     });
    CSG.cylinder = function(options) {
        var s = CSG.parseOptionAs3DVector(options, "start", [0, -1, 0]);
        var e = CSG.parseOptionAs3DVector(options, "end", [0, 1, 0]);
        var r = CSG.parseOptionAsFloat(options, "radius", 1);
        var rEnd = CSG.parseOptionAsFloat(options, "radiusEnd", r);
        var rStart = CSG.parseOptionAsFloat(options, "radiusStart", r);

        if ((rEnd < 0) || (rStart < 0)) {
            throw new Error("Radius should be non-negative");
        }
        if ((rEnd === 0) && (rStart === 0)) {
            throw new Error("Either radiusStart or radiusEnd should be positive");
        }

        var slices = CSG.parseOptionAsInt(options, "resolution", CSG.defaultResolution2D);
        var ray = e.minus(s);
        var axisZ = ray.unit(); //, isY = (Math.abs(axisZ.y) > 0.5);
        var axisX = axisZ.randomNonParallelVector().unit();

        //  var axisX = new CSG.Vector3D(isY, !isY, 0).cross(axisZ).unit();
        var axisY = axisX.cross(axisZ).unit();
        var start = new CSG.Vertex(s);
        var end = new CSG.Vertex(e);
        var polygons = [];

        function point(stack, slice, radius) {
            var angle = slice * Math.PI * 2;
            var out = axisX.times(Math.cos(angle)).plus(axisY.times(Math.sin(angle)));
            var pos = s.plus(ray.times(stack)).plus(out.times(radius));
            return new CSG.Vertex(pos);
        }
        for (var i = 0; i < slices; i++) {
            var t0 = i / slices,
                t1 = (i + 1) / slices;
            if (rEnd == rStart) {
                polygons.push(new CSG.Polygon([start, point(0, t0, rEnd), point(0, t1, rEnd)]));
                polygons.push(new CSG.Polygon([point(0, t1, rEnd), point(0, t0, rEnd), point(1, t0, rEnd), point(1, t1, rEnd)]));
                polygons.push(new CSG.Polygon([end, point(1, t1, rEnd), point(1, t0, rEnd)]));
            } else {
                if (rStart > 0) {
                    polygons.push(new CSG.Polygon([start, point(0, t0, rStart), point(0, t1, rStart)]));
                    polygons.push(new CSG.Polygon([point(0, t0, rStart), point(1, t0, rEnd), point(0, t1, rStart)]));
                }
                if (rEnd > 0) {
                    polygons.push(new CSG.Polygon([end, point(1, t1, rEnd), point(1, t0, rEnd)]));
                    polygons.push(new CSG.Polygon([point(1, t0, rEnd), point(1, t1, rEnd), point(0, t1, rStart)]));
                }
            }
        }
        var result = CSG.fromPolygons(polygons);
        result.properties.cylinder = new CSG.Properties();
        result.properties.cylinder.start = new CSG.Connector(s, axisZ.negated(), axisX);
        result.properties.cylinder.end = new CSG.Connector(e, axisZ, axisX);
        result.properties.cylinder.facepoint = s.plus(axisX.times(rStart));
        return result;
    };

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
    CSG.roundedCylinder = function(options) {
        var p1 = CSG.parseOptionAs3DVector(options, "start", [0, -1, 0]);
        var p2 = CSG.parseOptionAs3DVector(options, "end", [0, 1, 0]);
        var radius = CSG.parseOptionAsFloat(options, "radius", 1);
        var direction = p2.minus(p1);
        var defaultnormal;
        if (Math.abs(direction.x) > Math.abs(direction.y)) {
            defaultnormal = new CSG.Vector3D(0, 1, 0);
        } else {
            defaultnormal = new CSG.Vector3D(1, 0, 0);
        }
        var normal = CSG.parseOptionAs3DVector(options, "normal", defaultnormal);
        var resolution = CSG.parseOptionAsInt(options, "resolution", CSG.defaultResolution3D);
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
                vertices.push(new CSG.Vertex(p1.plus(cylinderpoint)));
                vertices.push(new CSG.Vertex(p1.plus(prevcylinderpoint)));
                vertices.push(new CSG.Vertex(p2.plus(prevcylinderpoint)));
                vertices.push(new CSG.Vertex(p2.plus(cylinderpoint)));
                polygons.push(new CSG.Polygon(vertices));
                var prevcospitch, prevsinpitch;
                for (var slice2 = 0; slice2 <= qresolution; slice2++) {
                    var pitch = 0.5 * Math.PI * slice2 / qresolution;
                    //var pitch = Math.asin(slice2/qresolution);
                    var cospitch = Math.cos(pitch);
                    var sinpitch = Math.sin(pitch);
                    if (slice2 > 0) {
                        vertices = [];
                        vertices.push(new CSG.Vertex(p1.plus(prevcylinderpoint.times(prevcospitch).minus(zvector.times(prevsinpitch)))));
                        vertices.push(new CSG.Vertex(p1.plus(cylinderpoint.times(prevcospitch).minus(zvector.times(prevsinpitch)))));
                        if (slice2 < qresolution) {
                            vertices.push(new CSG.Vertex(p1.plus(cylinderpoint.times(cospitch).minus(zvector.times(sinpitch)))));
                        }
                        vertices.push(new CSG.Vertex(p1.plus(prevcylinderpoint.times(cospitch).minus(zvector.times(sinpitch)))));
                        polygons.push(new CSG.Polygon(vertices));
                        vertices = [];
                        vertices.push(new CSG.Vertex(p2.plus(prevcylinderpoint.times(prevcospitch).plus(zvector.times(prevsinpitch)))));
                        vertices.push(new CSG.Vertex(p2.plus(cylinderpoint.times(prevcospitch).plus(zvector.times(prevsinpitch)))));
                        if (slice2 < qresolution) {
                            vertices.push(new CSG.Vertex(p2.plus(cylinderpoint.times(cospitch).plus(zvector.times(sinpitch)))));
                        }
                        vertices.push(new CSG.Vertex(p2.plus(prevcylinderpoint.times(cospitch).plus(zvector.times(sinpitch)))));
                        vertices.reverse();
                        polygons.push(new CSG.Polygon(vertices));
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
        result.properties.roundedCylinder = new CSG.Properties();
        result.properties.roundedCylinder.start = new CSG.Connector(p1, ray.negated(), axisX);
        result.properties.roundedCylinder.end = new CSG.Connector(p2, ray, axisX);
        result.properties.roundedCylinder.facepoint = p1.plus(xvector);
        return result;
    };

    // Construct an axis-aligned solid rounded cuboid.
    // Parameters:
    //   center: center of cube (default [0,0,0])
    //   radius: radius of cube (default [1,1,1]), can be specified as scalar or as 3D vector
    //   roundradius: radius of rounded corners (default 0.2), must be a scalar
    //   resolution: determines the number of polygons per 360 degree revolution (default 8)
    //
    // Example code:
    //
    //     var cube = CSG.roundedCube({
    //       center: [0, 0, 0],
    //       radius: 1,
    //       roundradius: 0.2,
    //       resolution: 8,
    //     });
    CSG.roundedCube = function(options) {
        var center = CSG.parseOptionAs3DVector(options, "center", [0, 0, 0]);
        var cuberadius = CSG.parseOptionAs3DVector(options, "radius", [1, 1, 1]);
        var resolution = CSG.parseOptionAsInt(options, "resolution", CSG.defaultResolution3D);
        if (resolution < 4) resolution = 4;
        var roundradius = CSG.parseOptionAsFloat(options, "roundradius", 0.2);
        var innercuberadius = cuberadius;
        innercuberadius = innercuberadius.minus(new CSG.Vector3D(roundradius));
        var result = CSG.cube({
            center: center,
            radius: [cuberadius.x, innercuberadius.y, innercuberadius.z]
        });
        result = result.unionSub(CSG.cube({
            center: center,
            radius: [innercuberadius.x, cuberadius.y, innercuberadius.z]
        }), false, false);
        result = result.unionSub(CSG.cube({
            center: center,
            radius: [innercuberadius.x, innercuberadius.y, cuberadius.z]
        }), false, false);
        for (var level = 0; level < 2; level++) {
            var z = innercuberadius.z;
            if (level == 1) z = -z;
            var p1 = new CSG.Vector3D(innercuberadius.x, innercuberadius.y, z).plus(center);
            var p2 = new CSG.Vector3D(innercuberadius.x, -innercuberadius.y, z).plus(center);
            var p3 = new CSG.Vector3D(-innercuberadius.x, -innercuberadius.y, z).plus(center);
            var p4 = new CSG.Vector3D(-innercuberadius.x, innercuberadius.y, z).plus(center);
            var sphere = CSG.sphere({
                center: p1,
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(sphere, false, false);
            sphere = CSG.sphere({
                center: p2,
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(sphere, false, false);
            sphere = CSG.sphere({
                center: p3,
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(sphere, false, false);
            sphere = CSG.sphere({
                center: p4,
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(sphere, false, true);
            var cylinder = CSG.cylinder({
                start: p1,
                end: p2,
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(cylinder, false, false);
            cylinder = CSG.cylinder({
                start: p2,
                end: p3,
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(cylinder, false, false);
            cylinder = CSG.cylinder({
                start: p3,
                end: p4,
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(cylinder, false, false);
            cylinder = CSG.cylinder({
                start: p4,
                end: p1,
                radius: roundradius,
                resolution: resolution
            });
            result = result.unionSub(cylinder, false, false);
            if (level === 0) {
                var d = new CSG.Vector3D(0, 0, -2 * z);
                cylinder = CSG.cylinder({
                    start: p1,
                    end: p1.plus(d),
                    radius: roundradius,
                    resolution: resolution
                });
                result = result.unionSub(cylinder);
                cylinder = CSG.cylinder({
                    start: p2,
                    end: p2.plus(d),
                    radius: roundradius,
                    resolution: resolution
                });
                result = result.unionSub(cylinder);
                cylinder = CSG.cylinder({
                    start: p3,
                    end: p3.plus(d),
                    radius: roundradius,
                    resolution: resolution
                });
                result = result.unionSub(cylinder);
                cylinder = CSG.cylinder({
                    start: p4,
                    end: p4.plus(d),
                    radius: roundradius,
                    resolution: resolution
                });
                result = result.unionSub(cylinder, false, true);
            }
        }
        result = result.reTesselated();
        result.properties.roundedCube = new CSG.Properties();
        result.properties.roundedCube.center = new CSG.Vertex(center);
        result.properties.roundedCube.facecenters = [
            new CSG.Connector(new CSG.Vector3D([cuberadius.x, 0, 0]).plus(center), [1, 0, 0], [0, 0, 1]),
            new CSG.Connector(new CSG.Vector3D([-cuberadius.x, 0, 0]).plus(center), [-1, 0, 0], [0, 0, 1]),
            new CSG.Connector(new CSG.Vector3D([0, cuberadius.y, 0]).plus(center), [0, 1, 0], [0, 0, 1]),
            new CSG.Connector(new CSG.Vector3D([0, -cuberadius.y, 0]).plus(center), [0, -1, 0], [0, 0, 1]),
            new CSG.Connector(new CSG.Vector3D([0, 0, cuberadius.z]).plus(center), [0, 0, 1], [1, 0, 0]),
            new CSG.Connector(new CSG.Vector3D([0, 0, -cuberadius.z]).plus(center), [0, 0, -1], [1, 0, 0])
        ];
        return result;
    }

}
