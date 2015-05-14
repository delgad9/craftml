// # class Polygon
// Represents a convex polygon. The vertices used to initialize a polygon must
// be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
// instances but they must behave similarly (duck typing can be used for
// customization).
//
// Each convex polygon has a `shared` property, which is shared between all
// polygons that are clones of each other or were split from the same polygon.
// This can be used to define per-polygon properties (such as surface color).
//
// The plane of the polygon is calculated from the vertex coordinates
// To avoid unnecessary recalculation, the plane can alternatively be
// passed as the third argument


var Plane = require('./Plane'),
    Vector3D = require('./Vector3D'),
    Vertex = require('./Vertex'),
    Matrix4x4 = require('../Matrix4x4'),
    getTag = require('../tag')

function Polygon(vertices, shared, plane) {
    this.vertices = vertices;
    if (!shared) shared = Polygon.defaultShared;
    this.shared = shared;
    //var numvertices = vertices.length;

    if (arguments.length >= 3) {
        this.plane = plane;
    } else {
        this.plane = Plane.fromVector3Ds(vertices[0].pos, vertices[1].pos, vertices[2].pos);
    }

    // if (_CSGDEBUG) {
    //     this.checkIfConvex();
    // }
};

// create from an untyped object with identical property names:
Polygon.fromObject = function(obj) {
    var vertices = obj.vertices.map(function(v) {
        return Vertex.fromObject(v);
    });
    var shared = Polygon.Shared.fromObject(obj.shared);
    var plane = Plane.fromObject(obj.plane);
    return new Polygon(vertices, shared, plane);
};

Polygon.prototype = {
    // check whether the polygon is convex (it should be, otherwise we will get unexpected results)
    checkIfConvex: function() {
        if (!Polygon.verticesConvex(this.vertices, this.plane.normal)) {
            Polygon.verticesConvex(this.vertices, this.plane.normal);
            throw new Error("Not convex!");
        }
    },

    /**
     * @param {Array} color [red, green, blue, alpha] color values are float numbers 0..1
     * @return {Polygon} The current polygon
     */
    setColor: function(red, green, blue, alpha) {
        var color = red instanceof Array ? red : [red || 0, green || 0, blue || 0, isNaN(alpha) ? 1. : alpha];
        this.shared = new Polygon.Shared(color);
        return this;
    },

    // Extrude a polygon into the direction offsetvector
    // Returns a CSG object
    extrude: function(offsetvector) {
        var newpolygons = [];

        var polygon1 = this;
        var direction = polygon1.plane.normal.dot(offsetvector);
        if (direction > 0) {
            polygon1 = polygon1.flipped();
        }
        newpolygons.push(polygon1);
        var polygon2 = polygon1.translate(offsetvector);
        var numvertices = this.vertices.length;
        for (var i = 0; i < numvertices; i++) {
            var sidefacepoints = [];
            var nexti = (i < (numvertices - 1)) ? i + 1 : 0;
            sidefacepoints.push(polygon1.vertices[i].pos);
            sidefacepoints.push(polygon2.vertices[i].pos);
            sidefacepoints.push(polygon2.vertices[nexti].pos);
            sidefacepoints.push(polygon1.vertices[nexti].pos);
            var sidefacepolygon = Polygon.createFromPoints(sidefacepoints, this.shared);
            newpolygons.push(sidefacepolygon);
        }
        polygon2 = polygon2.flipped();
        newpolygons.push(polygon2);
        return CSG.fromPolygons(newpolygons);
    },

    translate: function(offset) {
        return this.transform(Matrix4x4.translation(offset));
    },

    // returns an array with a CSG.Vector3D (center point) and a radius
    boundingSphere: function() {
        if (!this.cachedBoundingSphere) {
            var box = this.boundingBox();
            var middle = box[0].plus(box[1]).times(0.5);
            var radius3 = box[1].minus(middle);
            var radius = radius3.length();
            this.cachedBoundingSphere = [middle, radius];
        }
        return this.cachedBoundingSphere;
    },

    // returns an array of two CSG.Vector3Ds (minimum coordinates and maximum coordinates)
    boundingBox: function() {
        if (!this.cachedBoundingBox) {
            var minpoint, maxpoint;
            var vertices = this.vertices;
            var numvertices = vertices.length;
            if (numvertices === 0) {
                minpoint = new Vector3D(0, 0, 0);
            } else {
                minpoint = vertices[0].pos;
            }
            maxpoint = minpoint;
            for (var i = 1; i < numvertices; i++) {
                var point = vertices[i].pos;
                minpoint = minpoint.min(point);
                maxpoint = maxpoint.max(point);
            }
            this.cachedBoundingBox = [minpoint, maxpoint];
        }
        return this.cachedBoundingBox;
    },

    flipped: function() {
        var newvertices = this.vertices.map(function(v) {
            return v.flipped();
        });
        newvertices.reverse();
        var newplane = this.plane.flipped();
        return new Polygon(newvertices, this.shared, newplane);
    },

    // Affine transformation of polygon. Returns a new Polygon
    transform: function(matrix4x4) {
        var newvertices = this.vertices.map(function(v) {
            return v.transform(matrix4x4);
        });
        var newplane = this.plane.transform(matrix4x4);
        var scalefactor = matrix4x4.elements[0] * matrix4x4.elements[5] * matrix4x4.elements[10];
        if (scalefactor < 0) {
            // the transformation includes mirroring. We need to reverse the vertex order
            // in order to preserve the inside/outside orientation:
            newvertices.reverse();
        }
        return new Polygon(newvertices, this.shared, newplane);
    },

    toStlString: function() {
        var result = "";
        if (this.vertices.length >= 3) // should be!
        {
            // STL requires triangular polygons. If our polygon has more vertices, create
            // multiple triangles:
            var firstVertexStl = this.vertices[0].toStlString();
            for (var i = 0; i < this.vertices.length - 2; i++) {
                result += "facet normal " + this.plane.normal.toStlString() + "\nouter loop\n";
                result += firstVertexStl;
                result += this.vertices[i + 1].toStlString();
                result += this.vertices[i + 2].toStlString();
                result += "endloop\nendfacet\n";
            }
        }
        return result;
    },

    toString: function() {
        var result = "Polygon plane: " + this.plane.toString() + "\n";
        this.vertices.map(function(vertex) {
            result += "  " + vertex.toString() + "\n";
        });
        return result;
    },

    // project the 3D polygon onto a plane
    projectToOrthoNormalBasis: function(orthobasis) {
        var points2d = this.vertices.map(function(vertex) {
            return orthobasis.to2D(vertex.pos);
        });
        var result = CAG.fromPointsNoCheck(points2d);
        var area = result.area();
        if (Math.abs(area) < 1e-5) {
            // the polygon was perpendicular to the orthnormal plane. The resulting 2D polygon would be degenerate
            // return an empty area instead:
            result = new CAG();
        } else if (area < 0) {
            result = result.flipped();
        }
        return result;
    },

    /**
     * Creates solid from slices (Polygon) by generating walls
     * @param {Object} options Solid generating options
     *	- numslices {Number} Number of slices to be generated
     *	- callback(t, slice) {Function} Callback function generating slices.
     *			arguments: t = [0..1], slice = [0..numslices - 1]
     *			return: Polygon or null to skip
     *	- loop {Boolean} no flats, only walls, it's used to generate solids like a tor
     *
     *	by Eduard Bespalov AKA tedbeer (2013)
     */
    solidFromSlices: function(options) {
        var polygons = [],
            csg = null,
            prev = null,
            bottom = null,
            top = null,
            numSlices = 2,
            bLoop = false,
            fnCallback,
            flipped = null;

        if (options) {
            bLoop = Boolean(options['loop']);

            if (options.numslices)
                numSlices = options.numslices;

            if (options.callback)
                fnCallback = options.callback;
        }
        if (!fnCallback) {
            var square = new Polygon.createFromPoints([
                [0, 0, 0],
                [1, 0, 0],
                [1, 1, 0],
                [0, 1, 0]
            ]);
            fnCallback = function(t, slice) {
                return t == 0 || t == 1 ? square.translate([0, 0, t]) : null;
            }
        }
        for (var i = 0, iMax = numSlices - 1; i <= iMax; i++) {
            csg = fnCallback.call(this, i / iMax, i);
            if (csg) {
                if (!(csg instanceof Polygon)) {
                    throw new Error("Polygon.solidFromSlices callback error: Polygon expected");
                }
                csg.checkIfConvex();

                if (prev) { //generate walls
                    if (flipped === null) { //not generated yet
                        flipped = prev.plane.signedDistanceToPoint(csg.vertices[0].pos) < 0;
                    }
                    this._addWalls(polygons, prev, csg, flipped);

                } else { //the first - will be a bottom
                    bottom = csg;
                }
                prev = csg;
            } //callback can return null to skip that slice
        }
        top = csg;

        if (bLoop) {
            var bSameTopBottom = bottom.vertices.length == top.vertices.length &&
                bottom.vertices.every(function(v, index) {
                    return v.pos.equals(top.vertices[index].pos)
                });
            //if top and bottom are not the same -
            //generate walls between them
            if (!bSameTopBottom) {
                this._addWalls(polygons, top, bottom, flipped);
            } //else - already generated
        } else {
            //save top and bottom
            //TODO: flip if necessary
            polygons.unshift(flipped ? bottom : bottom.flipped());
            polygons.push(flipped ? top.flipped() : top);
        }
        return CSG.fromPolygons(polygons);
    },
    /**
     *
     * @param walls Array of wall polygons
     * @param bottom Bottom polygon
     * @param top Top polygon
     */
    _addWalls: function(walls, bottom, top, bFlipped) {
        var bottomPoints = bottom.vertices.slice(0), //make a copy
            topPoints = top.vertices.slice(0), //make a copy
            color = top.shared || null;

        //check if bottom perimeter is closed
        if (!bottomPoints[0].pos.equals(bottomPoints[bottomPoints.length - 1].pos)) {
            bottomPoints.push(bottomPoints[0]);
        }

        //check if top perimeter is closed
        if (!topPoints[0].pos.equals(topPoints[topPoints.length - 1].pos)) {
            topPoints.push(topPoints[0]);
        }
        if (bFlipped) {
            bottomPoints = bottomPoints.reverse();
            topPoints = topPoints.reverse();
        }

        var iTopLen = topPoints.length - 1,
            iBotLen = bottomPoints.length - 1,
            iExtra = iTopLen - iBotLen, //how many extra triangles we need
            bMoreTops = iExtra > 0,
            bMoreBottoms = iExtra < 0;

        var aMin = []; //indexes to start extra triangles (polygon with minimal square)
        //init - we need exactly /iExtra/ small triangles
        for (var i = Math.abs(iExtra); i > 0; i--) {
            aMin.push({
                len: Infinity,
                index: -1
            });
        }

        var len;
        if (bMoreBottoms) {
            for (var i = 0; i < iBotLen; i++) {
                len = bottomPoints[i].pos.distanceToSquared(bottomPoints[i + 1].pos);
                //find the element to replace
                for (var j = aMin.length - 1; j >= 0; j--) {
                    if (aMin[j].len > len) {
                        aMin[j].len = len;
                        aMin.index = j;
                        break;
                    }
                } //for
            }
        } else if (bMoreTops) {
            for (var i = 0; i < iTopLen; i++) {
                len = topPoints[i].pos.distanceToSquared(topPoints[i + 1].pos);
                //find the element to replace
                for (var j = aMin.length - 1; j >= 0; j--) {
                    if (aMin[j].len > len) {
                        aMin[j].len = len;
                        aMin.index = j;
                        break;
                    }
                } //for
            }
        } //if
        //sort by index
        aMin.sort(fnSortByIndex);
        var getTriangle = function addWallsPutTriangle(pointA, pointB, pointC, color) {
            return new Polygon([pointA, pointB, pointC], color);
            //return bFlipped ? triangle.flipped() : triangle;
        };

        var bpoint = bottomPoints[0],
            tpoint = topPoints[0],
            secondPoint,
            nBotFacet, nTopFacet; //length of triangle facet side
        for (var iB = 0, iT = 0, iMax = iTopLen + iBotLen; iB + iT < iMax;) {
            if (aMin.length) {
                if (bMoreTops && iT == aMin[0].index) { //one vertex is on the bottom, 2 - on the top
                    secondPoint = topPoints[++iT];
                    //console.log('<<< extra top: ' + secondPoint + ', ' + tpoint + ', bottom: ' + bpoint);
                    walls.push(getTriangle(
                        secondPoint, tpoint, bpoint, color
                    ));
                    tpoint = secondPoint;
                    aMin.shift();
                    continue;
                } else if (bMoreBottoms && iB == aMin[0].index) {
                    secondPoint = bottomPoints[++iB];
                    walls.push(getTriangle(
                        tpoint, bpoint, secondPoint, color
                    ));
                    bpoint = secondPoint;
                    aMin.shift();
                    continue;
                }
            }
            //choose the shortest path
            if (iB < iBotLen) { //one vertex is on the top, 2 - on the bottom
                nBotFacet = tpoint.pos.distanceToSquared(bottomPoints[iB + 1].pos);
            } else {
                nBotFacet = Infinity;
            }
            if (iT < iTopLen) { //one vertex is on the bottom, 2 - on the top
                nTopFacet = bpoint.pos.distanceToSquared(topPoints[iT + 1].pos);
            } else {
                nTopFacet = Infinity;
            }
            if (nBotFacet <= nTopFacet) {
                secondPoint = bottomPoints[++iB];
                walls.push(getTriangle(
                    tpoint, bpoint, secondPoint, color
                ));
                bpoint = secondPoint;
            } else if (iT < iTopLen) { //nTopFacet < Infinity
                secondPoint = topPoints[++iT];
                //console.log('<<< top: ' + secondPoint + ', ' + tpoint + ', bottom: ' + bpoint);
                walls.push(getTriangle(
                    secondPoint, tpoint, bpoint, color
                ));
                tpoint = secondPoint;
            };
        }
        return walls;
    }
};

Polygon.verticesConvex = function(vertices, planenormal) {
    var numvertices = vertices.length;
    if (numvertices > 2) {
        var prevprevpos = vertices[numvertices - 2].pos;
        var prevpos = vertices[numvertices - 1].pos;
        for (var i = 0; i < numvertices; i++) {
            var pos = vertices[i].pos;
            if (!Polygon.isConvexPoint(prevprevpos, prevpos, pos, planenormal)) {
                return false;
            }
            prevprevpos = prevpos;
            prevpos = pos;
        }
    }
    return true;
};

// Create a polygon from the given points
Polygon.createFromPoints = function(points, shared, plane) {
    var normal;
    if (arguments.length < 3) {
        // initially set a dummy vertex normal:
        normal = new Vector3D(0, 0, 0);
    } else {
        normal = plane.normal;
    }
    var vertices = [];
    points.map(function(p) {
        var vec = new Vector3D(p);
        var vertex = new Vertex(vec);
        vertices.push(vertex);
    });
    var polygon;
    if (arguments.length < 3) {
        polygon = new Polygon(vertices, shared);
    } else {
        polygon = new Polygon(vertices, shared, plane);
    }
    return polygon;
};

// calculate whether three points form a convex corner
//  prevpoint, point, nextpoint: the 3 coordinates (CSG.Vector3D instances)
//  normal: the normal vector of the plane
Polygon.isConvexPoint = function(prevpoint, point, nextpoint, normal) {
    var crossproduct = point.minus(prevpoint).cross(nextpoint.minus(point));
    var crossdotnormal = crossproduct.dot(normal);
    return (crossdotnormal >= 0);
};

Polygon.isStrictlyConvexPoint = function(prevpoint, point, nextpoint, normal) {
    var crossproduct = point.minus(prevpoint).cross(nextpoint.minus(point));
    var crossdotnormal = crossproduct.dot(normal);
    return (crossdotnormal >= 1e-5);
};

// # class Polygon.Shared
// Holds the shared properties for each polygon (currently only color)
Polygon.Shared = function(color) {
    this.color = color;
};

Polygon.Shared.fromObject = function(obj) {
    return new Polygon.Shared(obj.color);
};

Polygon.Shared.prototype = {
    getTag: function() {
        var result = this.tag;
        if (!result) {
            result = getTag();
            this.tag = result;
        }
        return result;
    },
    // get a string uniquely identifying this object
    getHash: function() {
        if (!this.color) return "null";
        return "" + this.color[0] + "/" + this.color[1] + "/" + this.color[2] + "/" + this.color[3];
    }
};

Polygon.defaultShared = new Polygon.Shared(null);

module.exports = Polygon
