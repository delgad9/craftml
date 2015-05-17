

//////////////////
// CAG: solid area geometry: like CSG but 2D
// Each area consists of a number of sides
// Each side is a line between 2 points
var CAG = function() {
	this.sides = [];
};

module.exports = CAG

var CSG = require('../csg')

// Construct a CAG from a list of `CAG.Side` instances.
CAG.fromSides = function(sides) {
	var cag = new CAG();
	cag.sides = sides;
	return cag;
};

var G = require('../geometry')

// Construct a CAG from a list of points (a polygon)
// Rotation direction of the points is not relevant. Points can be a convex or concave polygon.
// Polygon must not self intersect
CAG.fromPoints = function(points) {
	var numpoints = points.length;
	if(numpoints < 3) throw new Error("CAG shape needs at least 3 points");
	var sides = [];
	var prevpoint = new Vector2D(points[numpoints - 1]);
	var prevvertex = new CAG.Vertex(prevpoint);
	points.map(function(p) {
		var point = new Vector2D(p);
		var vertex = new CAG.Vertex(point);
		var side = new CAG.Side(prevvertex, vertex);
		sides.push(side);
		prevvertex = vertex;
	});
	var result = CAG.fromSides(sides);
	if(result.isSelfIntersecting()) {
		throw new Error("Polygon is self intersecting!");
	}
	var area = result.area();
	if(Math.abs(area) < 1e-5) {
		throw new Error("Degenerate polygon!");
	}
	if(area < 0) {
		result = result.flipped();
	}
	result = result.canonicalized();
	return result;
};

// Like CAG.fromPoints but does not check if it's a valid polygon.
// Points should rotate counter clockwise
CAG.fromPointsNoCheck = function(points) {
	var Vector2D = require('../geometry/Vector2D')
	var sides = [];
	var prevpoint = new Vector2D(points[points.length - 1]);
	var prevvertex = new CAG.Vertex(prevpoint);
	points.map(function(p) {
		var point = new Vector2D(p);
		var vertex = new CAG.Vertex(point);
		var side = new CAG.Side(prevvertex, vertex);
		sides.push(side);
		prevvertex = vertex;
	});
	return CAG.fromSides(sides);
};

// Converts a CSG to a CAG. The CSG must consist of polygons with only z coordinates +1 and -1
// as constructed by CAG.toCSG(-1, 1). This is so we can use the 3D union(), intersect() etc
CAG.fromFakeCSG = function(csg) {
	var sides = csg.polygons.map(function(p) {
		return CAG.Side.fromFakePolygon(p);
	});
	return CAG.fromSides(sides);
};

// see if the line between p0start and p0end intersects with the line between p1start and p1end
// returns true if the lines strictly intersect, the end points are not counted!
CAG.linesIntersect = function(p0start, p0end, p1start, p1end) {
	if(p0end.equals(p1start) || p1end.equals(p0start)) {
		var d = p1end.minus(p1start).unit().plus(p0end.minus(p0start).unit()).length();
		if(d < 1e-5) {
			return true;
		}
	} else {
		var d0 = p0end.minus(p0start);
		var d1 = p1end.minus(p1start);
		if(Math.abs(d0.cross(d1)) < 1e-9) return false; // lines are parallel
		var alphas = CSG.solve2Linear(-d0.x, d1.x, -d0.y, d1.y, p0start.x - p1start.x, p0start.y - p1start.y);
		if((alphas[0] > 1e-6) && (alphas[0] < 0.999999) && (alphas[1] > 1e-5) && (alphas[1] < 0.999999)) return true;
		//    if( (alphas[0] >= 0) && (alphas[0] <= 1) && (alphas[1] >= 0) && (alphas[1] <= 1) ) return true;
	}
	return false;
};



// Reconstruct a CAG from the output of toCompactBinary()
CAG.fromCompactBinary = function(bin) {
	if(bin['class'] != "CAG") throw new Error("Not a CAG");
	var vertices = [];
	var vertexData = bin.vertexData;
	var numvertices = vertexData.length / 2;
	var arrayindex = 0;
	for(var vertexindex = 0; vertexindex < numvertices; vertexindex++) {
		var x = vertexData[arrayindex++];
		var y = vertexData[arrayindex++];
		var pos = new CSG.Vector2D(x, y);
		var vertex = new CAG.Vertex(pos);
		vertices.push(vertex);
	}

	var sides = [];
	var numsides = bin.sideVertexIndices.length / 2;
	arrayindex = 0;
	for(var sideindex = 0; sideindex < numsides; sideindex++) {
		var vertexindex0 = bin.sideVertexIndices[arrayindex++];
		var vertexindex1 = bin.sideVertexIndices[arrayindex++];
		var side = new CAG.Side(vertices[vertexindex0], vertices[vertexindex1]);
		sides.push(side);
	}
	var cag = CAG.fromSides(sides);
	cag.isCanonicalized = true;
	return cag;
};

CAG.rectangle = require('./shapes/rectangle')
CAG.circle = require('./shapes/circle')
CAG.roundedRectangle = require('./shapes/roundedRectangle')

function fnSortByIndex(a, b) {
	return a.index - b.index;
}

CAG.prototype = {
	toString: function() {
		var result = "CAG (" + this.sides.length + " sides):\n";
		this.sides.map(function(side) {
			result += "  " + side.toString() + "\n";
		});
		return result;
	},

	toCSG: function(z0, z1) {
		var CSG = require('../csg')
		var polygons = this.sides.map(function(side) {
			return side.toPolygon3D(z0, z1);
		});
		return CSG.fromPolygons(polygons);
	},

	toDebugString1: function() {
		this.sides.sort(function(a, b) {
			return a.vertex0.pos.x - b.vertex0.pos.x;
		});
		var str = "";
		this.sides.map(function(side) {
			str += "(" + side.vertex0.pos.x + "," + side.vertex0.pos.y + ") - (" + side.vertex1.pos.x + "," + side.vertex1.pos.y + ")\n";
		});
		return str;
	},

	toDebugString: function() {
		//    this.sides.sort(function(a,b){
		//      return a.vertex0.pos.x - b.vertex0.pos.x;
		//    });
		var str = "CAG.fromSides([\n";
		this.sides.map(function(side) {
			str += "  new CAG.Side(new CAG.Vertex(new CSG.Vector2D(" +
					side.vertex0.pos.x + "," + side.vertex0.pos.y +
				")), new CAG.Vertex(new CSG.Vector2D(" +
					side.vertex1.pos.x + "," + side.vertex1.pos.y + "))),\n";
		});
		str += "]);\n";
		return str;
	},

	union: function(cag) {
		var cags;
		if(cag instanceof Array) {
			cags = cag;
		} else {
			cags = [cag];
		}
		var r = this.toCSG(-1, 1);
		cags.map(function(cag) {
			r = r.unionSub(cag.toCSG(-1, 1), false, false);
		});
		r = r.reTesselated();
		r = r.canonicalized();
		cag = CAG.fromFakeCSG(r);
		var cag_canonicalized = cag.canonicalized();
		return cag_canonicalized;
	},

	subtract: function(cag) {
		var cags;
		if(cag instanceof Array) {
			cags = cag;
		} else {
			cags = [cag];
		}
		var r = this.toCSG(-1, 1);
		cags.map(function(cag) {
			r = r.subtractSub(cag.toCSG(-1, 1), false, false);
		});
		r = r.reTesselated();
		r = r.canonicalized();
		r = CAG.fromFakeCSG(r);
		r = r.canonicalized();
		return r;
	},

	intersect: function(cag) {
		var cags;
		if(cag instanceof Array) {
			cags = cag;
		} else {
			cags = [cag];
		}
		var r = this.toCSG(-1, 1);
		cags.map(function(cag) {
			r = r.intersectSub(cag.toCSG(-1, 1), false, false);
		});
		r = r.reTesselated();
		r = r.canonicalized();
		r = CAG.fromFakeCSG(r);
		r = r.canonicalized();
		return r;
	},

	transform: function(matrix4x4) {
		var ismirror = matrix4x4.isMirroring();
		var newsides = this.sides.map(function(side) {
			return side.transform(matrix4x4);
		});
		var result = CAG.fromSides(newsides);
		if(ismirror) {
			result = result.flipped();
		}
		return result;
	},

	// see http://local.wasp.uwa.edu.au/~pbourke/geometry/polyarea/ :
	// Area of the polygon. For a counter clockwise rotating polygon the area is positive, otherwise negative
	area: function() {
		var polygonArea = 0;
		this.sides.map(function(side) {
			polygonArea += side.vertex0.pos.cross(side.vertex1.pos);
		});
		polygonArea *= 0.5;
		return polygonArea;
	},

	flipped: function() {
		var newsides = this.sides.map(function(side) {
			return side.flipped();
		});
		newsides.reverse();
		return CAG.fromSides(newsides);
	},

	getBounds: function() {
		var minpoint;
		if(this.sides.length === 0) {
			minpoint = new CSG.Vector2D(0, 0);
		} else {
			minpoint = this.sides[0].vertex0.pos;
		}
		var maxpoint = minpoint;
		this.sides.map(function(side) {
			minpoint = minpoint.min(side.vertex0.pos);
			minpoint = minpoint.min(side.vertex1.pos);
			maxpoint = maxpoint.max(side.vertex0.pos);
			maxpoint = maxpoint.max(side.vertex1.pos);
		});
		return [minpoint, maxpoint];
	},

   center: function(c) {
      if(!c.length) c = [c,c];
      var b = this.getBounds();
      return this.translate([
         c[0]?-(b[1].x-b[0].x)/2-b[0].x:0,
         c[1]?-(b[1].y-b[0].y)/2-b[0].y:0]);
   },

	isSelfIntersecting: function() {
		var numsides = this.sides.length;
		for(var i = 0; i < numsides; i++) {
			var side0 = this.sides[i];
			for(var ii = i + 1; ii < numsides; ii++) {
				var side1 = this.sides[ii];
				if(CAG.linesIntersect(side0.vertex0.pos, side0.vertex1.pos, side1.vertex0.pos, side1.vertex1.pos)) {
					return true;
				}
			}
		}
		return false;
	},

	expandedShell: function(radius, resolution) {
		var Vector2D = require('../geometry').Vector2D
		resolution = resolution || 8;
		if(resolution < 4) resolution = 4;
		var cags = [];
		var pointmap = {};
		var cag = this.canonicalized();
		cag.sides.map(function(side) {
			var d = side.vertex1.pos.minus(side.vertex0.pos);
			var dl = d.length();
			if(dl > 1e-5) {
				d = d.times(1.0 / dl);
				var normal = d.normal().times(radius);
				var shellpoints = [
					side.vertex1.pos.plus(normal),
					side.vertex1.pos.minus(normal),
					side.vertex0.pos.minus(normal),
					side.vertex0.pos.plus(normal)
				];
				//      var newcag = CAG.fromPointsNoCheck(shellpoints);
				var newcag = CAG.fromPoints(shellpoints);
				cags.push(newcag);
				for(var step = 0; step < 2; step++) {
					var p1 = (step === 0) ? side.vertex0.pos : side.vertex1.pos;
					var p2 = (step === 0) ? side.vertex1.pos : side.vertex0.pos;
					var tag = p1.x + " " + p1.y;
					if(!(tag in pointmap)) {
						pointmap[tag] = [];
					}
					pointmap[tag].push({
						"p1": p1,
						"p2": p2
					});
				}
			}
		});
		for(var tag in pointmap) {
			var m = pointmap[tag];
			var angle1, angle2;
			var pcenter = m[0].p1;
			if(m.length == 2) {
				var end1 = m[0].p2;
				var end2 = m[1].p2;
				angle1 = end1.minus(pcenter).angleDegrees();
				angle2 = end2.minus(pcenter).angleDegrees();
				if(angle2 < angle1) angle2 += 360;
				if(angle2 >= (angle1 + 360)) angle2 -= 360;
				if(angle2 < angle1 + 180) {
					var t = angle2;
					angle2 = angle1 + 360;
					angle1 = t;
				}
				angle1 += 90;
				angle2 -= 90;
			} else {
				angle1 = 0;
				angle2 = 360;
			}
			var fullcircle = (angle2 > angle1 + 359.999);
			if(fullcircle) {
				angle1 = 0;
				angle2 = 360;
			}
			if(angle2 > (angle1 + 1e-5)) {
				var points = [];
				if(!fullcircle) {
					points.push(pcenter);
				}
				var numsteps = Math.round(resolution * (angle2 - angle1) / 360);
				if(numsteps < 1) numsteps = 1;
				for(var step = 0; step <= numsteps; step++) {
					var angle = angle1 + step / numsteps * (angle2 - angle1);
					if(step == numsteps) angle = angle2; // prevent rounding errors
					var point = pcenter.plus(Vector2D.fromAngleDegrees(angle).times(radius));
					if((!fullcircle) || (step > 0)) {
						points.push(point);
					}
				}
				var newcag = CAG.fromPointsNoCheck(points);
				cags.push(newcag);
			}
		}
		var result = new CAG();
		result = result.union(cags);
		return result;
	},

	expand: function(radius, resolution) {
		var result = this.union(this.expandedShell(radius, resolution));
		return result;
	},

	contract: function(radius, resolution) {
		var result = this.subtract(this.expandedShell(radius, resolution));
		return result;
	},

	// extruded=cag.extrude({offset: [0,0,10], twistangle: 360, twiststeps: 100});
	// linear extrusion of 2D shape, with optional twist
	// The 2d shape is placed in in z=0 plane and extruded into direction <offset> (a CSG.Vector3D)
	// The final face is rotated <twistangle> degrees. Rotation is done around the origin of the 2d shape (i.e. x=0, y=0)
	// twiststeps determines the resolution of the twist (should be >= 1)
	// returns a CSG object
	extrude: function(options) {
		if(this.sides.length == 0) {
		// empty!
		return new CSG();
	}
	var offsetvector = CSG.parseOptionAs3DVector(options, "offset", [0,0,1]);
	var twistangle = CSG.parseOptionAsFloat(options, "twistangle", 0);
	var twiststeps = CSG.parseOptionAsInt(options, "twiststeps", 10);

	if(twistangle == 0) twiststeps = 1;
	if(twiststeps < 1) twiststeps = 1;

	var newpolygons = [];
	var prevtransformedcag;
	var prevstepz;
	for(var step=0; step <= twiststeps; step++) {
		var stepfraction = step / twiststeps;
		var transformedcag = this;
		var angle = twistangle * stepfraction;
		if(angle != 0) {
			transformedcag = transformedcag.rotateZ(angle);
		}
		var translatevector = new CSG.Vector2D(offsetvector.x, offsetvector.y).times(stepfraction);
		transformedcag = transformedcag.translate(translatevector);
		var bounds = transformedcag.getBounds();
		bounds[0] = bounds[0].minus(new CSG.Vector2D(1,1));
		bounds[1] = bounds[1].plus(new CSG.Vector2D(1,1));
		var stepz = offsetvector.z * stepfraction;
		if( (step == 0) || (step == twiststeps) ) {
			// bottom or top face:
			var csgshell = transformedcag.toCSG(stepz-1, stepz+1);
			var csgplane = CSG.fromPolygons([new CSG.Polygon([
				new CSG.Vertex(new CSG.Vector3D(bounds[0].x, bounds[0].y, stepz)),
				new CSG.Vertex(new CSG.Vector3D(bounds[1].x, bounds[0].y, stepz)),
				new CSG.Vertex(new CSG.Vector3D(bounds[1].x, bounds[1].y, stepz)),
				new CSG.Vertex(new CSG.Vector3D(bounds[0].x, bounds[1].y, stepz))
			])]);
			var flip = (step == 0);
			if(offsetvector.z < 0) flip = !flip;
			if(flip) {
				csgplane = csgplane.inverse();
			}
			csgplane = csgplane.intersect(csgshell);
			// only keep the polygons in the z plane:
			csgplane.polygons.map(function(polygon){
				if(Math.abs(polygon.plane.normal.z) > 0.99) {
					newpolygons.push(polygon);
				}
			});
		}
		if(step > 0) {
			var numsides = transformedcag.sides.length;
			for(var sideindex = 0; sideindex < numsides; sideindex++) {
				var thisside = transformedcag.sides[sideindex];
				var prevside = prevtransformedcag.sides[sideindex];
				var p1 = new CSG.Polygon([
					new CSG.Vertex(thisside.vertex1.pos.toVector3D(stepz)),
					new CSG.Vertex(thisside.vertex0.pos.toVector3D(stepz)),
					new CSG.Vertex(prevside.vertex0.pos.toVector3D(prevstepz))
				]);
				var p2 = new CSG.Polygon([
					new CSG.Vertex(thisside.vertex1.pos.toVector3D(stepz)),
					new CSG.Vertex(prevside.vertex0.pos.toVector3D(prevstepz)),
					new CSG.Vertex(prevside.vertex1.pos.toVector3D(prevstepz))
				]);
				if(offsetvector.z < 0) {
					p1 = p1.flipped();
					p2 = p2.flipped();
				}
				newpolygons.push(p1);
				newpolygons.push(p2);
			}
		}
		prevtransformedcag = transformedcag;
		prevstepz = stepz;
	} // for step
	return CSG.fromPolygons(newpolygons);
	},

	// check if we are a valid CAG (for debugging)
	check: function() {
		var errors = [];
		if(this.isSelfIntersecting()) {
			errors.push("Self intersects");
		}
		var pointcount = {};
		this.sides.map(function(side) {
			function mappoint(p) {
				var tag = p.x + " " + p.y;
				if(!(tag in pointcount)) pointcount[tag] = 0;
				pointcount[tag]++;
			}
			mappoint(side.vertex0.pos);
			mappoint(side.vertex1.pos);
		});
		for(var tag in pointcount) {
			var count = pointcount[tag];
			if(count & 1) {
				errors.push("Uneven number of sides (" + count + ") for point " + tag);
			}
		}
		var area = this.area();
		if(area < 1e-5) {
			errors.push("Area is " + area);
		}
		if(errors.length > 0) {
			var ertxt = "";
			errors.map(function(err) {
				ertxt += err + "\n";
			});
			throw new Error(ertxt);
		}
	},

	canonicalized: function() {
		if(this.isCanonicalized) {
			return this;
		} else {
			var factory = new CAG.fuzzyCAGFactory();
			var result = factory.getCAG(this);
			result.isCanonicalized = true;
			return result;
		}
	},

	toCompactBinary: function() {
		var cag = this.canonicalized();
		var numsides = cag.sides.length;
		var vertexmap = {};
		var vertices = [];
		var numvertices = 0;
		var sideVertexIndices = new Uint32Array(2 * numsides);
		var sidevertexindicesindex = 0;
		cag.sides.map(function(side) {
			[side.vertex0, side.vertex1].map(function(v) {
				var vertextag = v.getTag();
				var vertexindex;
				if(!(vertextag in vertexmap)) {
					vertexindex = numvertices++;
					vertexmap[vertextag] = vertexindex;
					vertices.push(v);
				} else {
					vertexindex = vertexmap[vertextag];
				}
				sideVertexIndices[sidevertexindicesindex++] = vertexindex;
			});
		});
		var vertexData = new Float64Array(numvertices * 2);
		var verticesArrayIndex = 0;
		vertices.map(function(v) {
			var pos = v.pos;
			vertexData[verticesArrayIndex++] = pos._x;
			vertexData[verticesArrayIndex++] = pos._y;
		});
		var result = {
			'class': "CAG",
			sideVertexIndices: sideVertexIndices,
			vertexData: vertexData
		};
		return result;
	},

	getOutlinePaths: function() {
		var cag = this.canonicalized();
		var sideTagToSideMap = {};
		var startVertexTagToSideTagMap = {};
		cag.sides.map(function(side) {
			var sidetag = side.getTag();
			sideTagToSideMap[sidetag] = side;
			var startvertextag = side.vertex0.getTag();
			if(!(startvertextag in startVertexTagToSideTagMap)) {
				startVertexTagToSideTagMap[startvertextag] = [];
			}
			startVertexTagToSideTagMap[startvertextag].push(sidetag);
		});
		var paths = [];
		while(true) {
			var startsidetag = null;
			for(var aVertexTag in startVertexTagToSideTagMap) {
				var sidesForThisVertex = startVertexTagToSideTagMap[aVertexTag];
				startsidetag = sidesForThisVertex[0];
				sidesForThisVertex.splice(0, 1);
				if(sidesForThisVertex.length === 0) {
					delete startVertexTagToSideTagMap[aVertexTag];
				}
				break;
			}
			if(startsidetag === null) break; // we've had all sides
			var connectedVertexPoints = [];
			var sidetag = startsidetag;
			var thisside = sideTagToSideMap[sidetag];
			var startvertextag = thisside.vertex0.getTag();
			while(true) {
				connectedVertexPoints.push(thisside.vertex0.pos);
				var nextvertextag = thisside.vertex1.getTag();
				if(nextvertextag == startvertextag) break; // we've closed the polygon
				if(!(nextvertextag in startVertexTagToSideTagMap)) {
					throw new Error("Area is not closed!");
				}
				var nextpossiblesidetags = startVertexTagToSideTagMap[nextvertextag];
				var nextsideindex = -1;
				if(nextpossiblesidetags.length == 1) {
					nextsideindex = 0;
				} else {
					// more than one side starting at the same vertex. This means we have
					// two shapes touching at the same corner
					var bestangle = null;
					var thisangle = thisside.direction().angleDegrees();
					for(var sideindex = 0; sideindex < nextpossiblesidetags.length; sideindex++) {
						var nextpossiblesidetag = nextpossiblesidetags[sideindex];
						var possibleside = sideTagToSideMap[nextpossiblesidetag];
						var angle = possibleside.direction().angleDegrees();
						var angledif = angle - thisangle;
						if(angledif < -180) angledif += 360;
						if(angledif >= 180) angledif -= 360;
						if((nextsideindex < 0) || (angledif > bestangle)) {
							nextsideindex = sideindex;
							bestangle = angledif;
						}
					}
				}
				var nextsidetag = nextpossiblesidetags[nextsideindex];
				nextpossiblesidetags.splice(nextsideindex, 1);
				if(nextpossiblesidetags.length === 0) {
					delete startVertexTagToSideTagMap[nextvertextag];
				}
				thisside = sideTagToSideMap[nextsidetag];
			} // inner loop
			var path = new CSG.Path2D(connectedVertexPoints, true);
			paths.push(path);
		} // outer loop
		return paths;
	},

	toDxf: function() {
		var paths = this.getOutlinePaths();
		return CAG.PathsToDxf(paths);
	}
};

CAG.PathsToDxf = function(paths) {
	var str = "999\nDXF generated by OpenJsCad\n";
	str += "  0\nSECTION\n  2\nHEADER\n";
	str += "  0\nENDSEC\n";
	str += "  0\nSECTION\n  2\nTABLES\n";
	str += "  0\nTABLE\n  2\nLTYPE\n  70\n1\n";
	str += "  0\nLTYPE\n  2\nCONTINUOUS\n  3\nSolid Line\n  72\n65\n  73\n0\n  40\n0.0\n";
	str += "  0\nENDTAB\n";
	str += "  0\nTABLE\n  2\nLAYER\n  70\n1\n";
	str += "  0\nLAYER\n  2\nOpenJsCad\n  62\n7\n  6\ncontinuous\n";
	str += "  0\nENDTAB\n";
	str += "  0\nTABLE\n  2\nSTYLE\n  70\n0\n  0\nENDTAB\n";
	str += "  0\nTABLE\n  2\nVIEW\n  70\n0\n  0\nENDTAB\n";
	str += "  0\nENDSEC\n";
	str += "  0\nSECTION\n  2\nBLOCKS\n";
	str += "  0\nENDSEC\n";
	str += "  0\nSECTION\n  2\nENTITIES\n";
	paths.map(function(path) {
		var numpoints_closed = path.points.length + (path.closed ? 1 : 0);
		str += "  0\nLWPOLYLINE\n  8\nOpenJsCad\n  90\n" + numpoints_closed + "\n  70\n" + (path.closed ? 1 : 0) + "\n";
		for(var pointindex = 0; pointindex < numpoints_closed; pointindex++) {
			var pointindexwrapped = pointindex;
			if(pointindexwrapped >= path.points.length) pointindexwrapped -= path.points.length;
			var point = path.points[pointindexwrapped];
			str += " 10\n" + point.x + "\n 20\n" + point.y + "\n 30\n0.0\n";
		}
	});
	str += "  0\nENDSEC\n  0\nEOF\n";
	return new Blob([str], {
		type: "application/dxf"
	});
};

require('./vertex')(CAG)
require('./side')(CAG)
require('./fuzzyCAGFactory')(CAG)

module.exports = CAG
