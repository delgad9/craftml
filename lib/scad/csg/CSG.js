// # class CSG
// Holds a binary space partition tree representing a 3D solid. Two solids can
// be combined using the `union()`, `subtract()`, and `intersect()` methods.

function CSG() {
	this.polygons = [];
	this.properties = new CSG.Properties();
	this.isCanonicalized = true;
	this.isRetesselated = true;
};

module.exports = CSG

// Construct a CSG solid from generated slices.
// Look at CSG.Polygon.prototype.solidFromSlices for details
CSG.fromSlices = function(options) {
	return (new CSG.Polygon.createFromPoints([
			[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]
	])).solidFromSlices(options);
};

CSG.prototype = {

	addConnector: function(name, point, axisvector, normalvector){
		this.properties[name] = new CSG.Connector(point, axisvector, normalvector);
	},

	addMarker: function(name, point){
		if (this.properties.markers === undefined){
			this.properties.markers = new CSG.Properties();
		}
		this.properties.markers[name] = new CSG.Vector3D(point);
	},

	addFlatSurface: function(name, p1, p2){
		if (this.properties.surfaces === undefined){
			this.properties.surfaces = new CSG.Properties();
		}
		this.properties.surfaces[name] = [new CSG.Vector3D(p1), new CSG.Vector3D(p2)];
	},

	toPolygons: function() {
		return this.polygons;
	},

	// Return a new CSG solid representing space in either this solid or in the
	// solid `csg`. Neither this solid nor the solid `csg` are modified.
	//
	//     A.union(B)
	//
	//     +-------+            +-------+
	//     |       |            |       |
	//     |   A   |            |       |
	//     |    +--+----+   =   |       +----+
	//     +----+--+    |       +----+       |
	//          |   B   |            |       |
	//          |       |            |       |
	//          +-------+            +-------+
	//
	union: function(csg) {
		var csgs;
		if(csg instanceof Array) {
			csgs = csg;
		} else {
			csgs = [csg];
		}
		var result = this;
		for(var i = 0; i < csgs.length; i++) {
			var islast = (i == (csgs.length - 1));
			result = result.unionSub(csgs[i], islast, islast);
		}
		return result;
	},

	unionSub: function(csg, retesselate, canonicalize) {
		if(!this.mayOverlap(csg)) {
			return this.unionForNonIntersecting(csg);
		} else {
			var a = new CSG.Tree(this.polygons);
			var b = new CSG.Tree(csg.polygons);
			a.clipTo(b, false);

			// b.clipTo(a, true); // ERROR: this doesn't work
			b.clipTo(a);
			b.invert();
			b.clipTo(a);
			b.invert();

			var newpolygons = a.allPolygons().concat(b.allPolygons());
			var result = CSG.fromPolygons(newpolygons);
			result.properties = this.properties._merge(csg.properties);
			if(retesselate) result = result.reTesselated();
			if(canonicalize) result = result.canonicalized();
			return result;
		}
	},

	// Like union, but when we know that the two solids are not intersecting
	// Do not use if you are not completely sure that the solids do not intersect!
	unionForNonIntersecting: function(csg) {
		var newpolygons = this.polygons.concat(csg.polygons);
		var result = CSG.fromPolygons(newpolygons);
		result.properties = this.properties._merge(csg.properties);
		result.isCanonicalized = this.isCanonicalized && csg.isCanonicalized;
		result.isRetesselated = this.isRetesselated && csg.isRetesselated;
		return result;
	},

	// Return a new CSG solid representing space in this solid but not in the
	// solid `csg`. Neither this solid nor the solid `csg` are modified.
	//
	//     A.subtract(B)
	//
	//     +-------+            +-------+
	//     |       |            |       |
	//     |   A   |            |       |
	//     |    +--+----+   =   |    +--+
	//     +----+--+    |       +----+
	//          |   B   |
	//          |       |
	//          +-------+
	//
	subtract: function(csg) {
		var csgs;
		if(csg instanceof Array) {
			csgs = csg;
		} else {
			csgs = [csg];
		}
		var result = this;
		for(var i = 0; i < csgs.length; i++) {
			var islast = (i == (csgs.length - 1));
			result = result.subtractSub(csgs[i], islast, islast);
		}
		return result;
	},

	subtractSub: function(csg, retesselate, canonicalize) {
		var a = new CSG.Tree(this.polygons);
		var b = new CSG.Tree(csg.polygons);
		a.invert();
		a.clipTo(b);
		b.clipTo(a, true);
		a.addPolygons(b.allPolygons());
		a.invert();
		var result = CSG.fromPolygons(a.allPolygons());
		result.properties = this.properties._merge(csg.properties);
		if(retesselate) result = result.reTesselated();
		if(canonicalize) result = result.canonicalized();
		return result;
	},

	// Return a new CSG solid representing space both this solid and in the
	// solid `csg`. Neither this solid nor the solid `csg` are modified.
	//
	//     A.intersect(B)
	//
	//     +-------+
	//     |       |
	//     |   A   |
	//     |    +--+----+   =   +--+
	//     +----+--+    |       +--+
	//          |   B   |
	//          |       |
	//          +-------+
	//
	intersect: function(csg) {
		var csgs;
		if(csg instanceof Array) {
			csgs = csg;
		} else {
			csgs = [csg];
		}
		var result = this;
		for(var i = 0; i < csgs.length; i++) {
			var islast = (i == (csgs.length - 1));
			result = result.intersectSub(csgs[i], islast, islast);
		}
		return result;
	},

	intersectSub: function(csg, retesselate, canonicalize) {
		var a = new CSG.Tree(this.polygons);
		var b = new CSG.Tree(csg.polygons);
		a.invert();
		b.clipTo(a);
		b.invert();
		a.clipTo(b);
		b.clipTo(a);
		a.addPolygons(b.allPolygons());
		a.invert();
		var result = CSG.fromPolygons(a.allPolygons());
		result.properties = this.properties._merge(csg.properties);
		if(retesselate) result = result.reTesselated();
		if(canonicalize) result = result.canonicalized();
		return result;
	},

	// Return a new CSG solid with solid and empty space switched. This solid is
	// not modified.
	inverse: function() {
		var flippedpolygons = this.polygons.map(function(p) {
			return p.flipped();
		});
		return CSG.fromPolygons(flippedpolygons);
		// TODO: flip properties
	},

	// Affine transformation of CSG object. Returns a new CSG object
	transform1: function(matrix4x4) {
		var newpolygons = this.polygons.map(function(p) {
			return p.transform(matrix4x4);
		});
		var result = CSG.fromPolygons(newpolygons);
		result.properties = this.properties._transform(matrix4x4);
		result.isRetesselated = this.isRetesselated;
		return result;
	},

	transform: function(matrix4x4) {
		var ismirror = matrix4x4.isMirroring();
		var transformedvertices = {};
		var transformedplanes = {};
		var newpolygons = this.polygons.map(function(p) {
			var newplane;
			var plane = p.plane;
			var planetag = plane.getTag();
			if(planetag in transformedplanes) {
				newplane = transformedplanes[planetag];
			} else {
				newplane = plane.transform(matrix4x4);
				transformedplanes[planetag] = newplane;
			}
			var newvertices = p.vertices.map(function(v) {
				var newvertex;
				var vertextag = v.getTag();
				if(vertextag in transformedvertices) {
					newvertex = transformedvertices[vertextag];
				} else {
					newvertex = v.transform(matrix4x4);
					transformedvertices[vertextag] = newvertex;
				}
				return newvertex;
			});
			if(ismirror) newvertices.reverse();
			return new CSG.Polygon(newvertices, p.shared, newplane);
		});
		var result = CSG.fromPolygons(newpolygons);
		result.properties = this.properties._transform(matrix4x4);
		result.isRetesselated = this.isRetesselated;
		result.isCanonicalized = this.isCanonicalized;
		return result;
	},

	toString: function() {
		var result = "CSG solid:\n";
		this.polygons.map(function(p) {
			result += p.toString();
		});
		return result;
	},

   center: function(c) {
      if(!c.length) c = [c,c,c];
      var b = this.getBounds();
      return this.translate([
         c[0]?-(b[1].x-b[0].x)/2-b[0].x:0,
         c[1]?-(b[1].y-b[0].y)/2-b[0].y:0,
         c[2]?-(b[1].z-b[0].z)/2-b[0].z:0]);
   },

	// Expand the solid
	// resolution: number of points per 360 degree for the rounded corners
	expand: function(radius, resolution) {
		var result = this.expandedShell(radius, resolution, true);
		result = result.reTesselated();
		result.properties = this.properties; // keep original properties
		return result;
	},

	// Contract the solid
	// resolution: number of points per 360 degree for the rounded corners
	contract: function(radius, resolution) {
		var expandedshell = this.expandedShell(radius, resolution, false);
		var result = this.subtract(expandedshell);
		result = result.reTesselated();
		result.properties = this.properties; // keep original properties
		return result;
	},

	canonicalized: function() {
		if(this.isCanonicalized) {
			return this;
		} else {
			var factory = new CSG.fuzzyCSGFactory();
			var result = factory.getCSG(this);
			result.isCanonicalized = true;
			result.isRetesselated = this.isRetesselated;
			result.properties = this.properties; // keep original properties
			return result;
		}
	},

	reTesselated: function() {
		if(this.isRetesselated) {
			return this;
		} else {
			var csg = this.canonicalized();
			var polygonsPerPlane = {};
			csg.polygons.map(function(polygon) {
				var planetag = polygon.plane.getTag();
				var sharedtag = polygon.shared.getTag();
				planetag += "/" + sharedtag;
				if(!(planetag in polygonsPerPlane)) {
					polygonsPerPlane[planetag] = [];
				}
				polygonsPerPlane[planetag].push(polygon);
			});
			var destpolygons = [];
			for(var planetag in polygonsPerPlane) {
				var sourcepolygons = polygonsPerPlane[planetag];
				if(sourcepolygons.length < 2) {
					destpolygons = destpolygons.concat(sourcepolygons);
				} else {
					var retesselayedpolygons = [];
					CSG.reTesselateCoplanarPolygons(sourcepolygons, retesselayedpolygons);
					destpolygons = destpolygons.concat(retesselayedpolygons);
				}
			}
			var result = CSG.fromPolygons(destpolygons);
			result.isRetesselated = true;
			result = result.canonicalized();
			//      result.isCanonicalized = true;
			result.properties = this.properties; // keep original properties
			return result;
		}
	},

	// returns an array of two CSG.Vector3Ds (minimum coordinates and maximum coordinates)
	getBounds: function() {
		if(!this.cachedBoundingBox) {
			var minpoint = new CSG.Vector3D(0, 0, 0);
			var maxpoint = new CSG.Vector3D(0, 0, 0);
			var polygons = this.polygons;
			var numpolygons = polygons.length;
			for(var i = 0; i < numpolygons; i++) {
				var polygon = polygons[i];
				var bounds = polygon.boundingBox();
				if(i === 0) {
					minpoint = bounds[0];
					maxpoint = bounds[1];
				} else {
					minpoint = minpoint.min(bounds[0]);
					maxpoint = maxpoint.max(bounds[1]);
				}
			}
			this.cachedBoundingBox = [minpoint, maxpoint];
		}
		return this.cachedBoundingBox;
	},

	// returns true if there is a possibility that the two solids overlap
	// returns false if we can be sure that they do not overlap
	mayOverlap: function(csg) {
		if((this.polygons.length === 0) || (csg.polygons.length === 0)) {
			return false;
		} else {
			var mybounds = this.getBounds();
			var otherbounds = csg.getBounds();
         // [0].x/y
         //    +-----+
         //    |     |
         //    |     |
         //    +-----+
         //          [1].x/y
         //return false;
         //echo(mybounds,"=",otherbounds);
			if(mybounds[1].x < otherbounds[0].x) return false;
			if(mybounds[0].x > otherbounds[1].x) return false;
			if(mybounds[1].y < otherbounds[0].y) return false;
			if(mybounds[0].y > otherbounds[1].y) return false;
			if(mybounds[1].z < otherbounds[0].z) return false;
			if(mybounds[0].z > otherbounds[1].z) return false;
			return true;
		}
	},

	// Cut the solid by a plane. Returns the solid on the back side of the plane
	cutByPlane: function(plane) {
		if(this.polygons.length === 0) {
			return new CSG();
		}
		// Ideally we would like to do an intersection with a polygon of inifinite size
		// but this is not supported by our implementation. As a workaround, we will create
		// a cube, with one face on the plane, and a size larger enough so that the entire
		// solid fits in the cube.
		// find the max distance of any vertex to the center of the plane:
		var planecenter = plane.normal.times(plane.w);
		var maxdistance = 0;
		this.polygons.map(function(polygon) {
			polygon.vertices.map(function(vertex) {
				var distance = vertex.pos.distanceToSquared(planecenter);
				if(distance > maxdistance) maxdistance = distance;
			});
		});
		maxdistance = Math.sqrt(maxdistance);
		maxdistance *= 1.01; // make sure it's really larger
		// Now build a polygon on the plane, at any point farther than maxdistance from the plane center:
		var vertices = [];
		var orthobasis = new CSG.OrthoNormalBasis(plane);
		vertices.push(new CSG.Vertex(orthobasis.to3D(new CSG.Vector2D(maxdistance, -maxdistance))));
		vertices.push(new CSG.Vertex(orthobasis.to3D(new CSG.Vector2D(-maxdistance, -maxdistance))));
		vertices.push(new CSG.Vertex(orthobasis.to3D(new CSG.Vector2D(-maxdistance, maxdistance))));
		vertices.push(new CSG.Vertex(orthobasis.to3D(new CSG.Vector2D(maxdistance, maxdistance))));
		var polygon = new CSG.Polygon(vertices, null, plane.flipped());

		// and extrude the polygon into a cube, backwards of the plane:
		var cube = polygon.extrude(plane.normal.times(-maxdistance));

		// Now we can do the intersection:
		var result = this.intersect(cube);
		result.properties = this.properties; // keep original properties
		return result;
	},

	// Connect a solid to another solid, such that two CSG.Connectors become connected
	//   myConnector: a CSG.Connector of this solid
	//   otherConnector: a CSG.Connector to which myConnector should be connected
	//   mirror: false: the 'axis' vectors of the connectors should point in the same direction
	//           true: the 'axis' vectors of the connectors should point in opposite direction
	//   normalrotation: degrees of rotation between the 'normal' vectors of the two
	//                   connectors
	connectTo: function(myConnector, otherConnector, mirror, normalrotation) {
		var matrix = myConnector.getTransformationTo(otherConnector, mirror, normalrotation);
		return this.transform(matrix);
	},

	// set the .shared property of all polygons
	// Returns a new CSG solid, the original is unmodified!
	setShared: function(shared) {
		var polygons = this.polygons.map(function(p) {
			return new CSG.Polygon(p.vertices, shared, p.plane);
		});
		var result = CSG.fromPolygons(polygons);
		result.properties = this.properties; // keep original properties
		result.isRetesselated = this.isRetesselated;
		result.isCanonicalized = this.isCanonicalized;
		return result;
	},

	/**
	 * @param {Array} color [red, green, blue] color values are float numbers 0..1
	 * @return {CSG} new CSG instance
	 */
	setColor: function(red, green, blue, alpha) { //for backward compatibility
		var color = red instanceof Array ? red : [red||0, green||0, blue||0, isNaN(alpha) ? 1. : alpha];
		var newshared = new CSG.Polygon.Shared(color);
		return this.setShared(newshared);
	},

	lieFlat: function() {
		var getTransformationToFlatLying = require('./algorithms/getTransformationToFlatLying')
		var transformation = getTransformationToFlatLying(this);
		return this.transform(transformation);
	},

	// project the 3D CSG onto a plane
	// This returns a 2D CAG with the 'shadow' shape of the 3D solid when projected onto the
	// plane represented by the orthonormal basis
	projectToOrthoNormalBasis: function(orthobasis) {
		var cags = [];
		this.polygons.map(function(polygon) {
			var cag = polygon.projectToOrthoNormalBasis(orthobasis);
			if(cag.sides.length > 0) {
				cags.push(cag);
			}
		});
		var result = new CAG().union(cags);
		return result;
	},

	sectionCut: function(orthobasis) {
		var plane1 = orthobasis.plane;
		var plane2 = orthobasis.plane.flipped();
		plane1 = new CSG.Plane(plane1.normal, plane1.w + 1e-4);
		plane2 = new CSG.Plane(plane2.normal, plane2.w + 1e-4);
		var cut3d = this.cutByPlane(plane1);
		cut3d = cut3d.cutByPlane(plane2);
		return cut3d.projectToOrthoNormalBasis(orthobasis);
	}
};

var _ = require('lodash')
_.mixin(CSG.prototype, require('./to'))
_.mixin(CSG, require('./from'))
_.mixin(CSG.prototype, require('./ext'))
_.mixin(CSG, require('./shapes'))



// solve 2x2 linear equation:
// [ab][x] = [u]
// [cd][y]   [v]
CSG.solve2Linear = function(a, b, c, d, u, v) {
	var det = a * d - b * c;
	var invdet = 1.0 / det;
	var x = u * d - b * v;
	var y = -u * c + a * v;
	x *= invdet;
	y *= invdet;
	return [x, y];
};

CSG.Vertex = require('./geometry/Vertex')
CSG.Plane = require('./geometry/Plane')
CSG.Polygon = require('./geometry/Polygon')

CSG.PolygonTreeNode = require('./bsp/PolygonTreeNode')
CSG.Tree = require('./bsp/Tree')
CSG.Node = require('./bsp/Node')

CSG.OrthoNormalBasis = require('./geometry/OrthoNormalBasis')
CSG.Matrix4x4 = require('./Matrix4x4')
CSG.Vector3D = require('./geometry/Vector3D')
CSG.Vector2D = require('./geometry/Vector2D')
CSG.Line2D = require('./geometry/Line2D')
CSG.Line3D = require('./geometry/Line3D')

CSG.Path2D = require('./geometry/Path2D')
CSG.Path2D.arc = require('./shapes/arc')

CSG.reTesselateCoplanarPolygons = require('./algorithms/reTesselateCoplanarPolygons')

require('./fuzzyFactory')(CSG)
require('./fuzzyCSGFactory')(CSG)

CSG.Properties = require('./Properties')
CSG.getTag = require('./tag')
CSG.Connector = require('./Connector')

// Add several convenience methods to the classes that support a transform() method:
CSG.addTransformationMethodsToPrototype = function(prot) {
	prot.mirrored = function(plane) {
		return this.transform(CSG.Matrix4x4.mirroring(plane));
	};

	prot.mirroredX = function() {
		var plane = new CSG.Plane(new CSG.Vector3D(1, 0, 0), 0);
		return this.mirrored(plane);
	};

	prot.mirroredY = function() {
		var plane = new CSG.Plane(new CSG.Vector3D(0, 1, 0), 0);
		return this.mirrored(plane);
	};

	prot.mirroredZ = function() {
		var plane = new CSG.Plane(new CSG.Vector3D(0, 0, 1), 0);
		return this.mirrored(plane);
	};

	prot.translate = function(v) {
		return this.transform(CSG.Matrix4x4.translation(v));
	};

	prot.scale = function(f) {
		return this.transform(CSG.Matrix4x4.scaling(f));
	};

	prot.rotateX = function(deg) {
		return this.transform(CSG.Matrix4x4.rotationX(deg));
	};

	prot.rotateY = function(deg) {
		return this.transform(CSG.Matrix4x4.rotationY(deg));
	};

	prot.rotateZ = function(deg) {
		return this.transform(CSG.Matrix4x4.rotationZ(deg));
	};

	prot.rotate = function(rotationCenter, rotationAxis, degrees) {
		return this.transform(CSG.Matrix4x4.rotation(rotationCenter, rotationAxis, degrees));
	};
};

//////////////////////////////////////
CSG.addTransformationMethodsToPrototype(CSG.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Vector2D.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Vector3D.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Vertex.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Plane.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Polygon.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Line3D.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Connector.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Path2D.prototype);
CSG.addTransformationMethodsToPrototype(CSG.Line2D.prototype);
