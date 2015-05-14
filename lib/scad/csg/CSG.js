/*
## License
Copyright (c) 2015 Tom Yeh (tom.yeh@colorado.edu): node-ified
Copyright (c) 2013 Eduard Bespalov (edwbes@gmail.com): .solidFromSlices()
Copyright (c) 2013 Rene K. Mueller (http://OpenJSCAD.org): AMF export added, CSG.center([flag,flag,flag]);
Copyright (c) 2012 Joost Nieuwenhuijse (joost@newhouse.nl)
Copyright (c) 2012 Alexandre Girard (https://github.com/alx)
Copyright (c) 2011 Evan Wallace (http://evanw.github.com/csg.js/) -- original csg.js

All code released under MIT license

## Overview

For an overview of the CSG process see the original csg.js code:
http://evanw.github.com/csg.js/

CSG operations through BSP trees suffer from one problem: heavy fragmentation
of polygons. If two CSG solids of n polygons are unified, the resulting solid may have
in the order of n*n polygons, because each polygon is split by the planes of all other
polygons. After a few operations the number of polygons explodes.

This version of CSG.js solves the problem in 3 ways:

1. Every polygon split is recorded in a tree (CSG.PolygonTreeNode). This is a separate
tree, not to be confused with the CSG tree. If a polygon is split into two parts but in
the end both fragments have not been discarded by the CSG operation, we can retrieve
the original unsplit polygon from the tree, instead of the two fragments.

This does not completely solve the issue though: if a polygon is split multiple times
the number of fragments depends on the order of subsequent splits, and we might still
end up with unncessary splits:
Suppose a polygon is first split into A and B, and then into A1, B1, A2, B2. Suppose B2 is
discarded. We will end up with 2 polygons: A and B1. Depending on the actual split boundaries
we could still have joined A and B1 into one polygon. Therefore a second approach is used as well:

2. After CSG operations all coplanar polygon fragments are joined by a retesselating
operation. See CSG.reTesselated(). Retesselation is done through a
linear sweep over the polygon surface. The sweep line passes over the y coordinates
of all vertices in the polygon. Polygons are split at each sweep line, and the fragments
are joined horizontally and vertically into larger polygons (making sure that we
will end up with convex polygons).
This still doesn't solve the problem completely: due to floating point imprecisions
we may end up with small gaps between polygons, and polygons may not be exactly coplanar
anymore, and as a result the retesselation algorithm may fail to join those polygons.
Therefore:

3. A canonicalization algorithm is implemented: it looks for vertices that have
approximately the same coordinates (with a certain tolerance, say 1e-5) and replaces
them with the same vertex. If polygons share a vertex they will actually point to the
same CSG.Vertex instance. The same is done for polygon planes. See CSG.canonicalized().


Performance improvements to the original CSG.js:

Replaced the flip() and invert() methods by flipped() and inverted() which don't
modify the source object. This allows to get rid of all clone() calls, so that
multiple polygons can refer to the same CSG.Plane instance etc.

The original union() used an extra invert(), clipTo(), invert() sequence just to remove the
coplanar front faces from b; this is now combined in a single b.clipTo(a, true) call.

Detection whether a polygon is in front or in back of a plane: for each polygon
we are caching the coordinates of the bounding sphere. If the bounding sphere is
in front or in back of the plane we don't have to check the individual vertices
anymore.


Other additions to the original CSG.js:

CSG.Vector class has been renamed into CSG.Vector3D

Classes for 3D lines, 2D vectors, 2D lines, and methods to find the intersection of
a line and a plane etc.

Transformations: CSG.transform(), CSG.translate(), CSG.rotate(), CSG.scale()

Expanding or contracting a solid: CSG.expand() and CSG.contract(). Creates nice
smooth corners.

The vertex normal has been removed since it complicates retesselation. It's not needed
for solid CAD anyway.

*/

/*
## License

Copyright (c) 2013 Eduard Bespalov (edwbes@gmail.com): .solidFromSlices()
Copyright (c) 2013 Rene K. Mueller (http://OpenJSCAD.org): AMF export added, CSG.center([flag,flag,flag]);
Copyright (c) 2012 Joost Nieuwenhuijse (joost@newhouse.nl)
Copyright (c) 2012 Alexandre Girard (https://github.com/alx)
Copyright (c) 2011 Evan Wallace (http://evanw.github.com/csg.js/) -- original csg.js

All code released under MIT license

## Overview

For an overview of the CSG process see the original csg.js code:
http://evanw.github.com/csg.js/

CSG operations through BSP trees suffer from one problem: heavy fragmentation
of polygons. If two CSG solids of n polygons are unified, the resulting solid may have
in the order of n*n polygons, because each polygon is split by the planes of all other
polygons. After a few operations the number of polygons explodes.

This version of CSG.js solves the problem in 3 ways:

1. Every polygon split is recorded in a tree (CSG.PolygonTreeNode). This is a separate
tree, not to be confused with the CSG tree. If a polygon is split into two parts but in
the end both fragments have not been discarded by the CSG operation, we can retrieve
the original unsplit polygon from the tree, instead of the two fragments.

This does not completely solve the issue though: if a polygon is split multiple times
the number of fragments depends on the order of subsequent splits, and we might still
end up with unncessary splits:
Suppose a polygon is first split into A and B, and then into A1, B1, A2, B2. Suppose B2 is
discarded. We will end up with 2 polygons: A and B1. Depending on the actual split boundaries
we could still have joined A and B1 into one polygon. Therefore a second approach is used as well:

2. After CSG operations all coplanar polygon fragments are joined by a retesselating
operation. See CSG.reTesselated(). Retesselation is done through a
linear sweep over the polygon surface. The sweep line passes over the y coordinates
of all vertices in the polygon. Polygons are split at each sweep line, and the fragments
are joined horizontally and vertically into larger polygons (making sure that we
will end up with convex polygons).
This still doesn't solve the problem completely: due to floating point imprecisions
we may end up with small gaps between polygons, and polygons may not be exactly coplanar
anymore, and as a result the retesselation algorithm may fail to join those polygons.
Therefore:

3. A canonicalization algorithm is implemented: it looks for vertices that have
approximately the same coordinates (with a certain tolerance, say 1e-5) and replaces
them with the same vertex. If polygons share a vertex they will actually point to the
same CSG.Vertex instance. The same is done for polygon planes. See CSG.canonicalized().


Performance improvements to the original CSG.js:

Replaced the flip() and invert() methods by flipped() and inverted() which don't
modify the source object. This allows to get rid of all clone() calls, so that
multiple polygons can refer to the same CSG.Plane instance etc.

The original union() used an extra invert(), clipTo(), invert() sequence just to remove the
coplanar front faces from b; this is now combined in a single b.clipTo(a, true) call.

Detection whether a polygon is in front or in back of a plane: for each polygon
we are caching the coordinates of the bounding sphere. If the bounding sphere is
in front or in back of the plane we don't have to check the individual vertices
anymore.


Other additions to the original CSG.js:

CSG.Vector class has been renamed into CSG.Vector3D

Classes for 3D lines, 2D vectors, 2D lines, and methods to find the intersection of
a line and a plane etc.

Transformations: CSG.transform(), CSG.translate(), CSG.rotate(), CSG.scale()

Expanding or contracting a solid: CSG.expand() and CSG.contract(). Creates nice
smooth corners.

The vertex normal has been removed since it complicates retesselation. It's not needed
for solid CAD anyway.

*/

var _CSGDEBUG = false;

function fnNumberSort(a, b) {
	return a - b;
}

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

CSG.defaultResolution2D = 32;
CSG.defaultResolution3D = 12;

// Construct a CSG solid from a list of `CSG.Polygon` instances.
CSG.fromPolygons = function(polygons) {
	var csg = new CSG();
	csg.polygons = polygons;
	csg.isCanonicalized = false;
	csg.isRetesselated = false;
	return csg;
};

// Construct a CSG solid from generated slices.
// Look at CSG.Polygon.prototype.solidFromSlices for details
CSG.fromSlices = function(options) {
	return (new CSG.Polygon.createFromPoints([
			[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]
	])).solidFromSlices(options);
};

// create from an untyped object with identical property names:
CSG.fromObject = function(obj) {
	var polygons = obj.polygons.map(function(p) {
		return CSG.Polygon.fromObject(p);
	});
	var csg = CSG.fromPolygons(polygons);
	csg = csg.canonicalized();
	return csg;
};

// Reconstruct a CSG from the output of toCompactBinary()
CSG.fromCompactBinary = function(bin) {
	if(bin['class'] != "CSG") throw new Error("Not a CSG");
	var planes = [],
		planeData = bin.planeData,
		numplanes = planeData.length / 4,
		arrayindex = 0,
		x, y, z, w, normal, plane;
	for(var planeindex = 0; planeindex < numplanes; planeindex++) {
		x = planeData[arrayindex++];
		y = planeData[arrayindex++];
		z = planeData[arrayindex++];
		w = planeData[arrayindex++];
		normal = new CSG.Vector3D(x, y, z);
		plane = new CSG.Plane(normal, w);
		planes.push(plane);
	}

	var vertices = [],
		vertexData = bin.vertexData,
		numvertices = vertexData.length / 3,
		pos, vertex;
	arrayindex = 0;
	for(var vertexindex = 0; vertexindex < numvertices; vertexindex++) {
		x = vertexData[arrayindex++];
		y = vertexData[arrayindex++];
		z = vertexData[arrayindex++];
		pos = new CSG.Vector3D(x, y, z);
		vertex = new CSG.Vertex(pos);
		vertices.push(vertex);
	}

	var shareds = bin.shared.map(function(shared) {
		return CSG.Polygon.Shared.fromObject(shared);
	});

	var polygons = [],
		numpolygons = bin.numPolygons,
		numVerticesPerPolygon = bin.numVerticesPerPolygon,
		polygonVertices = bin.polygonVertices,
		polygonPlaneIndexes = bin.polygonPlaneIndexes,
		polygonSharedIndexes = bin.polygonSharedIndexes,
		numpolygonvertices, polygonvertices, shared, polygon;//already defined plane,
	arrayindex = 0;
	for(var polygonindex = 0; polygonindex < numpolygons; polygonindex++) {
		numpolygonvertices = numVerticesPerPolygon[polygonindex];
		polygonvertices = [];
		for(var i = 0; i < numpolygonvertices; i++) {
			polygonvertices.push(vertices[polygonVertices[arrayindex++]]);
		}
		plane = planes[polygonPlaneIndexes[polygonindex]];
		shared = shareds[polygonSharedIndexes[polygonindex]];
		polygon = new CSG.Polygon(polygonvertices, shared, plane);
		polygons.push(polygon);
	}
	var csg = CSG.fromPolygons(polygons);
	csg.isCanonicalized = true;
	csg.isRetesselated = true;
	return csg;
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

	toStlString: function() {
		var result = "solid csg.js\n";
		this.polygons.map(function(p) {
			result += p.toStlString();
		});
		result += "endsolid csg.js\n";
		return result;
	},

	toAMFString: function(m) {
		var result = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<amf"+(m&&m.unit?" unit=\"+m.unit\"":"")+">\n";
		for(var k in m) {
			result += "<metadata type=\""+k+"\">"+m[k]+"</metadata>\n";
		}
		result += "<object id=\"0\">\n<mesh>\n<vertices>\n";

		this.polygons.map(function(p) {                  // first we dump all vertices of all polygons
         for(var i=0; i<p.vertices.length; i++) {
            result += p.vertices[i].toAMFString();
         }
      });
      result += "</vertices>\n";

      var n = 0;
		this.polygons.map(function(p) {                  // then we dump all polygons
         result += "<volume>\n";
         if(p.vertices.length<3)
            return;
			var r = 1, g = 0.4, b = 1, a = 1, colorSet = false;
			if(p.shared && p.shared.color) {
				r = p.shared.color[0];
				g = p.shared.color[1];
				b = p.shared.color[2];
            a = p.shared.color[3];
				colorSet = true;
			} else if(p.color) {
            r = p.color[0];
            g = p.color[1];
            b = p.color[2];
            if(p.color.length()>3) a = p.color[3];
				colorSet = true;
         }

   		result += "<color><r>"+r+"</r><g>"+g+"</g><b>"+b+"</b>"+(a!==undefined?"<a>"+a+"</a>":"")+"</color>";

         for(var i=0; i<p.vertices.length-2; i++) {      // making sure they are all triangles (triangular polygons)
            result += "<triangle>";
            result += "<v1>" + (n) + "</v1>";
            result += "<v2>" + (n+i+1) + "</v2>";
            result += "<v3>" + (n+i+2) + "</v3>";
            result += "</triangle>\n";
         }
         n += p.vertices.length;
         result += "</volume>\n";
		});
		result += "</mesh>\n</object>\n";
		result += "</amf>\n";
		return result;
	},

	toX3D: function() {
		// materialPolygonLists
		// key: a color string (e.g. "0 1 1" for yellow)
		// value: an array of strings specifying polygons of this color
		//        (as space-separated indices into vertexCoords)
		var materialPolygonLists = {},
		// list of coordinates (as "x y z" strings)
			vertexCoords = [],
		// map to look up the index in vertexCoords of a given vertex
			vertexTagToCoordIndexMap = {};

		this.polygons.map(function(p) {
			var red = 0,
				green = 0,
				blue = 1; // default color is blue
			if(p.shared && p.shared.color) {
				red = p.shared.color[0];
				green = p.shared.color[1];
				blue = p.shared.color[2];
			}

			var polygonVertexIndices = [],
				numvertices = p.vertices.length,
				vertex;
			for(var i = 0; i < numvertices; i++) {
				vertex = p.vertices[i];
				if(!(vertex.getTag() in vertexTagToCoordIndexMap)) {
					vertexCoords.push(vertex.pos._x.toString() + " " +
						vertex.pos._y.toString() + " " +
						vertex.pos._z.toString()
					);
					vertexTagToCoordIndexMap[vertex.getTag()] = vertexCoords.length - 1;
				}
				polygonVertexIndices.push(vertexTagToCoordIndexMap[vertex.getTag()]);
			}

			var polygonString = polygonVertexIndices.join(" ");

			var colorString = red.toString() + " " + green.toString() + " " + blue.toString();
			if(!(colorString in materialPolygonLists)) {
				materialPolygonLists[colorString] = [];
			}
			// add this polygonString to the list of colorString-colored polygons
			materialPolygonLists[colorString].push(polygonString);
		});


		// create output document
		var docType = document.implementation.createDocumentType("X3D",
			'ISO//Web3D//DTD X3D 3.1//EN" "http://www.web3d.org/specifications/x3d-3.1.dtd', null);
		var exportDoc = document.implementation.createDocument(null, "X3D", docType);
		exportDoc.insertBefore(
			exportDoc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"'),
			exportDoc.doctype);

		var exportRoot = exportDoc.getElementsByTagName("X3D")[0];
		exportRoot.setAttribute("profile", "Interchange");
		exportRoot.setAttribute("version", "3.1");
		exportRoot.setAttribute("xsd:noNamespaceSchemaLocation","http://www.web3d.org/specifications/x3d-3.1.xsd");
		exportRoot.setAttribute("xmlns:xsd", "http://www.w3.org/2001/XMLSchema-instance");

		var exportScene = exportDoc.createElement("Scene");
		exportRoot.appendChild(exportScene);

		/*
	  For each color, create a shape made of an appropriately colored
	  material which contains all polygons that are this color.

	  The first shape will contain the definition of all vertices,
	  (<Coordinate DEF="coords_mesh"/>), which will be referenced by
	  subsequent shapes.
	*/
		var coordsMeshDefined = false;
		for(var colorString in materialPolygonLists) {
			var polygonList = materialPolygonLists[colorString];
			var shape = exportDoc.createElement("Shape");
			exportScene.appendChild(shape);

			var appearance = exportDoc.createElement("Appearance");
			shape.appendChild(appearance);

			var material = exportDoc.createElement("Material");
			appearance.appendChild(material);
			material.setAttribute("diffuseColor", colorString);
			material.setAttribute("ambientIntensity", "1.0");

			var ifs = exportDoc.createElement("IndexedFaceSet");
			shape.appendChild(ifs);
			ifs.setAttribute("solid", "true");
			ifs.setAttribute("coordIndex", polygonList.join(" -1 ") + " -1");

			var coordinate = exportDoc.createElement("Coordinate");
			ifs.appendChild(coordinate);
			if(coordsMeshDefined) {
				coordinate.setAttribute("USE", "coords_mesh");
			} else {
				coordinate.setAttribute("DEF", "coords_mesh");
				coordinate.setAttribute("point", vertexCoords.join(" "));
				coordsMeshDefined = true;
			}
		}

		var x3dstring = (new XMLSerializer()).serializeToString(exportDoc);
		return new Blob([x3dstring], {
			type: "model/x3d+xml"
		});
	},

	// see http://en.wikipedia.org/wiki/STL_%28file_format%29#Binary_STL
	toStlBinary: function(p) {
		// first check if the host is little-endian:
		var buffer = new ArrayBuffer(4);
		var int32buffer = new Int32Array(buffer, 0, 1);
		var int8buffer = new Int8Array(buffer, 0, 4);
		int32buffer[0] = 0x11223344;
		if(int8buffer[0] != 0x44) {
			throw new Error("Binary STL output is currently only supported on little-endian (Intel) processors");
		}

		var numtriangles = 0;
		this.polygons.map(function(p) {
			var numvertices = p.vertices.length;
			var thisnumtriangles = (numvertices >= 3) ? numvertices - 2 : 0;
			numtriangles += thisnumtriangles;
		});
		var headerarray = new Uint8Array(80);
		for(var i = 0; i < 80; i++) {
			headerarray[i] = 65;
		}
		var ar1 = new Uint32Array(1);
		ar1[0] = numtriangles;
		// write the triangles to allTrianglesBuffer:
		var allTrianglesBuffer = new ArrayBuffer(50 * numtriangles);
		var allTrianglesBufferAsInt8 = new Int8Array(allTrianglesBuffer);
		// a tricky problem is that a Float32Array must be aligned at 4-byte boundaries (at least in certain browsers)
		// while each triangle takes 50 bytes. Therefore we write each triangle to a temporary buffer, and copy that
		// into allTrianglesBuffer:
		var triangleBuffer = new ArrayBuffer(50);
		var triangleBufferAsInt8 = new Int8Array(triangleBuffer);
		// each triangle consists of 12 floats:
		var triangleFloat32array = new Float32Array(triangleBuffer, 0, 12);
		// and one uint16:
		var triangleUint16array = new Uint16Array(triangleBuffer, 48, 1);
		var byteoffset = 0;
		this.polygons.map(function(p) {
			var numvertices = p.vertices.length;
			for(var i = 0; i < numvertices - 2; i++) {
				var normal = p.plane.normal;
				triangleFloat32array[0] = normal._x;
				triangleFloat32array[1] = normal._y;
				triangleFloat32array[2] = normal._z;
				var arindex = 3;
				for(var v = 0; v < 3; v++) {
					var vv = v + ((v > 0) ? i : 0);
					var vertexpos = p.vertices[vv].pos;
					triangleFloat32array[arindex++] = vertexpos._x;
					triangleFloat32array[arindex++] = vertexpos._y;
					triangleFloat32array[arindex++] = vertexpos._z;
				}
				triangleUint16array[0] = 0;
				// copy the triangle into allTrianglesBuffer:
				allTrianglesBufferAsInt8.set(triangleBufferAsInt8, byteoffset);
				byteoffset += 50;
			}
		});
      if(p&&p.webBlob) {      // -- want a blob direct
			return new Blob([headerarray.buffer, ar1.buffer, allTrianglesBuffer], {
			   type: "application/sla"
			});
      } else {
         // we differentiate, as binary string blobbing gives bad blob in web, we need binary string for CLI
         //    perhaps there is a way to make it working (see openjscad for stlb)\
         //
         // concat 3 buffers together -- don't make blob so early, we want data (non-blob) for nodejs too
         //    must be string data direct to write
         var stl = new Uint8Array(headerarray.buffer.byteLength + ar1.buffer.byteLength + allTrianglesBuffer.byteLength);
         var j = 0;
         for(var i=0; i<headerarray.buffer.byteLength; i++) { stl.buffer[j++] = headerarray.buffer[i]; }
         for(var i=0; i<ar1.buffer.byteLength; i++) { stl.buffer[j++] = ar1.buffer[i]; }
         for(var i=0; i<allTrianglesBuffer.byteLength; i++) { stl.buffer[j++] = allTrianglesBuffer[i]; }
         return String.fromCharCode.apply(null, new Uint8Array(stl.buffer));

      }
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

	// Create the expanded shell of the solid:
	// All faces are extruded to get a thickness of 2*radius
	// Cylinders are constructed around every side
	// Spheres are placed on every vertex
	// unionWithThis: if true, the resulting solid will be united with 'this' solid;
	//   the result is a true expansion of the solid
	//   If false, returns only the shell
	expandedShell: function(radius, resolution, unionWithThis) {
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

	toCompactBinary: function() {
		var csg = this.canonicalized(),
			numpolygons = csg.polygons.length,
			numpolygonvertices = 0,
			numvertices = 0,
			vertexmap = {},
			vertices = [],
			numplanes = 0,
			planemap = {},
			polygonindex = 0,
			planes = [],
			shareds = [],
			sharedmap = {},
			numshared = 0;
		// for (var i = 0, iMax = csg.polygons.length; i < iMax; i++) {
		// 	var p = csg.polygons[i];
		// 	for (var j = 0, jMax = p.length; j < jMax; j++) {
		// 		++numpolygonvertices;
		// 		var vertextag = p[j].getTag();
		// 		if(!(vertextag in vertexmap)) {
		// 			vertexmap[vertextag] = numvertices++;
		// 			vertices.push(p[j]);
		// 		}
		// 	}
		csg.polygons.map(function(p) {
			p.vertices.map(function(v) {
				++numpolygonvertices;
				var vertextag = v.getTag();
				if(!(vertextag in vertexmap)) {
					vertexmap[vertextag] = numvertices++;
					vertices.push(v);
				}
			});

			var planetag = p.plane.getTag();
			if(!(planetag in planemap)) {
				planemap[planetag] = numplanes++;
				planes.push(p.plane);
			}
			var sharedtag = p.shared.getTag();
			if(!(sharedtag in sharedmap)) {
				sharedmap[sharedtag] = numshared++;
				shareds.push(p.shared);
			}
		});
		var numVerticesPerPolygon = new Uint32Array(numpolygons),
			polygonSharedIndexes = new Uint32Array(numpolygons),
			polygonVertices = new Uint32Array(numpolygonvertices),
			polygonPlaneIndexes = new Uint32Array(numpolygons),
			vertexData = new Float64Array(numvertices * 3),
			planeData = new Float64Array(numplanes * 4),
			polygonVerticesIndex = 0;
		for(var polygonindex = 0; polygonindex < numpolygons; ++polygonindex) {
			var p = csg.polygons[polygonindex];
			numVerticesPerPolygon[polygonindex] = p.vertices.length;
			p.vertices.map(function(v) {
				var vertextag = v.getTag();
				var vertexindex = vertexmap[vertextag];
				polygonVertices[polygonVerticesIndex++] = vertexindex;
			});
			var planetag = p.plane.getTag();
			var planeindex = planemap[planetag];
			polygonPlaneIndexes[polygonindex] = planeindex;
			var sharedtag = p.shared.getTag();
			var sharedindex = sharedmap[sharedtag];
			polygonSharedIndexes[polygonindex] = sharedindex;
		}
		var verticesArrayIndex = 0;
		vertices.map(function(v) {
			var pos = v.pos;
			vertexData[verticesArrayIndex++] = pos._x;
			vertexData[verticesArrayIndex++] = pos._y;
			vertexData[verticesArrayIndex++] = pos._z;
		});
		var planesArrayIndex = 0;
		planes.map(function(p) {
			var normal = p.normal;
			planeData[planesArrayIndex++] = normal._x;
			planeData[planesArrayIndex++] = normal._y;
			planeData[planesArrayIndex++] = normal._z;
			planeData[planesArrayIndex++] = p.w;
		});
		var result = {
			"class": "CSG",
			numPolygons: numpolygons,
			numVerticesPerPolygon: numVerticesPerPolygon,
			polygonPlaneIndexes: polygonPlaneIndexes,
			polygonSharedIndexes: polygonSharedIndexes,
			polygonVertices: polygonVertices,
			vertexData: vertexData,
			planeData: planeData,
			shared: shareds
		};
		return result;
	},

	// For debugging
	// Creates a new solid with a tiny cube at every vertex of the source solid
	toPointCloud: function(cuberadius) {
		var csg = this.reTesselated();

		var result = new CSG();

		// make a list of all unique vertices
		// For each vertex we also collect the list of normals of the planes touching the vertices
		var vertexmap = {};
		csg.polygons.map(function(polygon) {
			polygon.vertices.map(function(vertex) {
				vertexmap[vertex.getTag()] = vertex.pos;
			});
		});

		for(var vertextag in vertexmap) {
			var pos = vertexmap[vertextag];
			var cube = CSG.cube({
				center: pos,
				radius: cuberadius
			});
			result = result.unionSub(cube, false, false);
		}
		result = result.reTesselated();
		return result;
	},

	// Get the transformation that transforms this CSG such that it is lying on the z=0 plane,
	// as flat as possible (i.e. the least z-height).
	// So that it is in an orientation suitable for CNC milling
	getTransformationToFlatLying: function() {
		if(this.polygons.length === 0) {
			return new CSG.Matrix4x4(); // unity
		} else {
			// get a list of unique planes in the CSG:
			var csg = this.canonicalized();
			var planemap = {};
			csg.polygons.map(function(polygon) {
				planemap[polygon.plane.getTag()] = polygon.plane;
			});
			// try each plane in the CSG and find the plane that, when we align it flat onto z=0,
			// gives the least height in z-direction.
			// If two planes give the same height, pick the plane that originally had a normal closest
			// to [0,0,-1].
			var xvector = new CSG.Vector3D(1, 0, 0);
			var yvector = new CSG.Vector3D(0, 1, 0);
			var zvector = new CSG.Vector3D(0, 0, 1);
			var z0connectorx = new CSG.Connector([0, 0, 0], [0, 0, -1], xvector);
			var z0connectory = new CSG.Connector([0, 0, 0], [0, 0, -1], yvector);
			var isfirst = true;
			var minheight = 0;
			var maxdotz = 0;
			var besttransformation;
			for(var planetag in planemap) {
				var plane = planemap[planetag];
				var pointonplane = plane.normal.times(plane.w);
				var transformation;
				// We need a normal vecrtor for the transformation
				// determine which is more perpendicular to the plane normal: x or y?
				// we will align this as much as possible to the x or y axis vector
				var xorthogonality = plane.normal.cross(xvector).length();
				var yorthogonality = plane.normal.cross(yvector).length();
				if(xorthogonality > yorthogonality) {
					// x is better:
					var planeconnector = new CSG.Connector(pointonplane, plane.normal, xvector);
					transformation = planeconnector.getTransformationTo(z0connectorx, false, 0);
				} else {
					// y is better:
					var planeconnector = new CSG.Connector(pointonplane, plane.normal, yvector);
					transformation = planeconnector.getTransformationTo(z0connectory, false, 0);
				}
				var transformedcsg = csg.transform(transformation);
				var dotz = -plane.normal.dot(zvector);
				var bounds = transformedcsg.getBounds();
				var zheight = bounds[1].z - bounds[0].z;
				var isbetter = isfirst;
				if(!isbetter) {
					if(zheight < minheight) {
						isbetter = true;
					} else if(zheight == minheight) {
						if(dotz > maxdotz) isbetter = true;
					}
				}
				if(isbetter) {
					// translate the transformation around the z-axis and onto the z plane:
					var translation = [
						-0.5 * (bounds[1].x + bounds[0].x),
						-0.5 * (bounds[1].y + bounds[0].y),
						-bounds[0].z];
					transformation = transformation.multiply(CSG.Matrix4x4.translation(translation));
					minheight = zheight;
					maxdotz = dotz;
					besttransformation = transformation;
				}
				isfirst = false;
			}
			return besttransformation;
		}
	},

	lieFlat: function() {
		var transformation = this.getTransformationToFlatLying();
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
	},

	/*
  fixTJunctions:

  Suppose we have two polygons ACDB and EDGF:

   A-----B
   |     |
   |     E--F
   |     |  |
   C-----D--G

  Note that vertex E forms a T-junction on the side BD. In this case some STL slicers will complain
  that the solid is not watertight. This is because the watertightness check is done by checking if
  each side DE is matched by another side ED.

  This function will return a new solid with ACDB replaced by ACDEB

  Note that this can create polygons that are slightly non-convex (due to rounding errors). Therefore the result should
  not be used for further CSG operations!
  */
	fixTJunctions: function() {
		var csg = this.canonicalized();
		var sidemap = {};
		for(var polygonindex = 0; polygonindex < csg.polygons.length; polygonindex++) {
			var polygon = csg.polygons[polygonindex];
			var numvertices = polygon.vertices.length;
			if(numvertices >= 3) // should be true
			{
				var vertex = polygon.vertices[0];
				var vertextag = vertex.getTag();
				for(var vertexindex = 0; vertexindex < numvertices; vertexindex++) {
					var nextvertexindex = vertexindex + 1;
					if(nextvertexindex == numvertices) nextvertexindex = 0;
					var nextvertex = polygon.vertices[nextvertexindex];
					var nextvertextag = nextvertex.getTag();
					var sidetag = vertextag + "/" + nextvertextag;
					var reversesidetag = nextvertextag + "/" + vertextag;
					if(reversesidetag in sidemap) {
						// this side matches the same side in another polygon. Remove from sidemap:
						var ar = sidemap[reversesidetag];
						ar.splice(-1, 1);
						if(ar.length === 0) {
							delete sidemap[reversesidetag];
						}
					} else {
						var sideobj = {
							vertex0: vertex,
							vertex1: nextvertex,
							polygonindex: polygonindex
						};
						if(!(sidetag in sidemap)) {
							sidemap[sidetag] = [sideobj];
						} else {
							sidemap[sidetag].push(sideobj);
						}
					}
					vertex = nextvertex;
					vertextag = nextvertextag;
				}
			}
		}
		// now sidemap contains 'unmatched' sides
		// i.e. side AB in one polygon does not have a matching side BA in another polygon
		var vertextag2sidestart = {};
		var vertextag2sideend = {};
		var sidestocheck = {};
		var sidemapisempty = true;
		for(var sidetag in sidemap) {
			sidemapisempty = false;
			sidestocheck[sidetag] = true;
			sidemap[sidetag].map(function(sideobj) {
				var starttag = sideobj.vertex0.getTag();
				var endtag = sideobj.vertex1.getTag();
				if(starttag in vertextag2sidestart) {
					vertextag2sidestart[starttag].push(sidetag);
				} else {
					vertextag2sidestart[starttag] = [sidetag];
				}
				if(endtag in vertextag2sideend) {
					vertextag2sideend[endtag].push(sidetag);
				} else {
					vertextag2sideend[endtag] = [sidetag];
				}
			});
		}

		if(!sidemapisempty) {
			// make a copy of the polygons array, since we are going to modify it:
			var polygons = csg.polygons.slice(0);

			function addSide (vertex0, vertex1, polygonindex) {
				var starttag = vertex0.getTag();
				var endtag = vertex1.getTag();
				if(starttag == endtag) throw new Error("Assertion failed");
				var newsidetag = starttag + "/" + endtag;
				var reversesidetag = endtag + "/" + starttag;
				if(reversesidetag in sidemap) {
					// we have a matching reverse oriented side.
					// Instead of adding the new side, cancel out the reverse side:
					// console.log("addSide("+newsidetag+") has reverse side:");
					deleteSide(vertex1, vertex0, null);
					return null;
				}
				//  console.log("addSide("+newsidetag+")");
				var newsideobj = {
					vertex0: vertex0,
					vertex1: vertex1,
					polygonindex: polygonindex
				};
				if(!(newsidetag in sidemap)) {
					sidemap[newsidetag] = [newsideobj];
				} else {
					sidemap[newsidetag].push(newsideobj);
				}
				if(starttag in vertextag2sidestart) {
					vertextag2sidestart[starttag].push(newsidetag);
				} else {
					vertextag2sidestart[starttag] = [newsidetag];
				}
				if(endtag in vertextag2sideend) {
					vertextag2sideend[endtag].push(newsidetag);
				} else {
					vertextag2sideend[endtag] = [newsidetag];
				}
				return newsidetag;
			}

			function deleteSide (vertex0, vertex1, polygonindex) {
				var starttag = vertex0.getTag();
				var endtag = vertex1.getTag();
				var sidetag = starttag + "/" + endtag;
				// console.log("deleteSide("+sidetag+")");
				if(!(sidetag in sidemap)) throw new Error("Assertion failed");
				var idx = -1;
				var sideobjs = sidemap[sidetag];
				for(var i = 0; i < sideobjs.length; i++) {
					var sideobj = sideobjs[i];
					if(sideobj.vertex0 != vertex0) continue;
					if(sideobj.vertex1 != vertex1) continue;
					if(polygonindex !== null) {
						if(sideobj.polygonindex != polygonindex) continue;
					}
					idx = i;
					break;
				}
				if(idx < 0) throw new Error("Assertion failed");
				sideobjs.splice(idx, 1);
				if(sideobjs.length === 0) {
					delete sidemap[sidetag];
				}
				idx = vertextag2sidestart[starttag].indexOf(sidetag);
				if(idx < 0) throw new Error("Assertion failed");
				vertextag2sidestart[starttag].splice(idx, 1);
				if(vertextag2sidestart[starttag].length === 0) {
					delete vertextag2sidestart[starttag];
				}

				idx = vertextag2sideend[endtag].indexOf(sidetag);
				if(idx < 0) throw new Error("Assertion failed");
				vertextag2sideend[endtag].splice(idx, 1);
				if(vertextag2sideend[endtag].length === 0) {
					delete vertextag2sideend[endtag];
				}
			}


			while(true) {
				var sidemapisempty = true;
				for(var sidetag in sidemap) {
					sidemapisempty = false;
					sidestocheck[sidetag] = true;
				}
				if(sidemapisempty) break;
				var donesomething = false;
				while(true) {
					var sidetagtocheck = null;
					for(var sidetag in sidestocheck) {
						sidetagtocheck = sidetag;
						break;
					}
					if(sidetagtocheck === null) break; // sidestocheck is empty, we're done!
					var donewithside = true;
					if(sidetagtocheck in sidemap) {
						var sideobjs = sidemap[sidetagtocheck];
						if(sideobjs.length === 0) throw new Error("Assertion failed");
						var sideobj = sideobjs[0];
						for(var directionindex = 0; directionindex < 2; directionindex++) {
							var startvertex = (directionindex === 0) ? sideobj.vertex0 : sideobj.vertex1;
							var endvertex = (directionindex === 0) ? sideobj.vertex1 : sideobj.vertex0;
							var startvertextag = startvertex.getTag();
							var endvertextag = endvertex.getTag();
							var matchingsides = [];
							if(directionindex === 0) {
								if(startvertextag in vertextag2sideend) {
									matchingsides = vertextag2sideend[startvertextag];
								}
							} else {
								if(startvertextag in vertextag2sidestart) {
									matchingsides = vertextag2sidestart[startvertextag];
								}
							}
							for(var matchingsideindex = 0; matchingsideindex < matchingsides.length; matchingsideindex++) {
								var matchingsidetag = matchingsides[matchingsideindex];
								var matchingside = sidemap[matchingsidetag][0];
								var matchingsidestartvertex = (directionindex === 0) ? matchingside.vertex0 : matchingside.vertex1;
								var matchingsideendvertex = (directionindex === 0) ? matchingside.vertex1 : matchingside.vertex0;
								var matchingsidestartvertextag = matchingsidestartvertex.getTag();
								var matchingsideendvertextag = matchingsideendvertex.getTag();
								if(matchingsideendvertextag != startvertextag) throw new Error("Assertion failed");
								if(matchingsidestartvertextag == endvertextag) {
									// matchingside cancels sidetagtocheck
									deleteSide(startvertex, endvertex, null);
									deleteSide(endvertex, startvertex, null);
									donewithside = false;
									directionindex = 2; // skip reverse direction check
									donesomething = true;
									break;
								} else {
									var startpos = startvertex.pos;
									var endpos = endvertex.pos;
									var checkpos = matchingsidestartvertex.pos;
									var direction = checkpos.minus(startpos);
									// Now we need to check if endpos is on the line startpos-checkpos:
									var t = endpos.minus(startpos).dot(direction) / direction.dot(direction);
									if((t > 0) && (t < 1)) {
										var closestpoint = startpos.plus(direction.times(t));
										var distancesquared = closestpoint.distanceToSquared(endpos);
										if(distancesquared < 1e-10) {
											// Yes it's a t-junction! We need to split matchingside in two:
											var polygonindex = matchingside.polygonindex;
											var polygon = polygons[polygonindex];
											// find the index of startvertextag in polygon:
											var insertionvertextag = matchingside.vertex1.getTag();
											var insertionvertextagindex = -1;
											for(var i = 0; i < polygon.vertices.length; i++) {
												if(polygon.vertices[i].getTag() == insertionvertextag) {
													insertionvertextagindex = i;
													break;
												}
											}
											if(insertionvertextagindex < 0) throw new Error("Assertion failed");
											// split the side by inserting the vertex:
											var newvertices = polygon.vertices.slice(0);
											newvertices.splice(insertionvertextagindex, 0, endvertex);
											var newpolygon = new CSG.Polygon(newvertices, polygon.shared /*polygon.plane*/ );
											polygons[polygonindex] = newpolygon;

											// remove the original sides from our maps:
											// deleteSide(sideobj.vertex0, sideobj.vertex1, null);
											deleteSide(matchingside.vertex0, matchingside.vertex1, polygonindex);
											var newsidetag1 = addSide(matchingside.vertex0, endvertex, polygonindex);
											var newsidetag2 = addSide(endvertex, matchingside.vertex1, polygonindex);
											if(newsidetag1 !== null) sidestocheck[newsidetag1] = true;
											if(newsidetag2 !== null) sidestocheck[newsidetag2] = true;
											donewithside = false;
											directionindex = 2; // skip reverse direction check
											donesomething = true;
											break;
										} // if(distancesquared < 1e-10)
									} // if( (t > 0) && (t < 1) )
								} // if(endingstidestartvertextag == endvertextag)
							} // for matchingsideindex
						} // for directionindex
					} // if(sidetagtocheck in sidemap)
					if(donewithside) {
						delete sidestocheck[sidetag];
					}
				}
				if(!donesomething) break;
			}
			var newcsg = CSG.fromPolygons(polygons);
			newcsg.properties = csg.properties;
			newcsg.isCanonicalized = true;
			newcsg.isRetesselated = true;
			csg = newcsg;
		} // if(!sidemapisempty)
		var sidemapisempty = true;
		for(var sidetag in sidemap) {
			sidemapisempty = false;
			break;
		}
		if(!sidemapisempty) {
			throw new Error("!sidemapisempty");
		}
		return csg;
	}
};

CSG.IsFloat = function(n) {
	return(!isNaN(n)) || (n === Infinity) || (n === -Infinity);
};

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

CSG.cube = require('./shapes/cube')
CSG.sphere = require('./shapes/sphere')
CSG.cylinder = require('./shapes/cylinder')
CSG.roundedCylinder = require('./shapes/roundedCylinder')
CSG.roundedCube = require('./shapes/roundedCube')

CSG.Vertex = require('./Vertex')
CSG.Plane = require('./Plane')
CSG.Polygon = require('./Polygon')

require('./polygonTreeNode')(CSG)
require('./tree')(CSG)
require('./node')(CSG)

CSG.OrthoNormalBasis = require('./OrthoNormalBasis')
CSG.Matrix4x4 = require('./Matrix4x4')
CSG.Vector3D = require('./Vector3D')
CSG.Vector2D = require('./Vector2D')
CSG.Line2D = require('./Line2D')
CSG.Line3D = require('./Line3D')

function insertSorted(array, element, comparefunc) {
	var leftbound = 0;
	var rightbound = array.length;
	while(rightbound > leftbound) {
		var testindex = Math.floor((leftbound + rightbound) / 2);
		var testelement = array[testindex];
		var compareresult = comparefunc(element, testelement);
		if(compareresult > 0) // element > testelement
		{
			leftbound = testindex + 1;
		} else {
			rightbound = testindex;
		}
	}
	array.splice(leftbound, 0, element);
}

// Get the x coordinate of a point with a certain y coordinate, interpolated between two
// points (CSG.Vector2D).
// Interpolation is robust even if the points have the same y coordinate
CSG.interpolateBetween2DPointsForY = function(point1, point2, y) {
	var f1 = y - point1.y;
	var f2 = point2.y - point1.y;
	if(f2 < 0) {
		f1 = -f1;
		f2 = -f2;
	}
	var t;
	if(f1 <= 0) {
		t = 0.0;
	} else if(f1 >= f2) {
		t = 1.0;
	} else if(f2 < 1e-10) {
		t = 0.5;
	} else {
		t = f1 / f2;
	}
	var result = point1.x + t * (point2.x - point1.x);
	return result;
};

// Retesselation function for a set of coplanar polygons. See the introduction at the top of
// this file.
CSG.reTesselateCoplanarPolygons = function(sourcepolygons, destpolygons) {
	var EPS = 1e-5;

	var numpolygons = sourcepolygons.length;
	if(numpolygons > 0) {
		var plane = sourcepolygons[0].plane;
		var shared = sourcepolygons[0].shared;
		var orthobasis = new CSG.OrthoNormalBasis(plane);
		var polygonvertices2d = []; // array of array of CSG.Vector2D
		var polygontopvertexindexes = []; // array of indexes of topmost vertex per polygon
		var topy2polygonindexes = {};
		var ycoordinatetopolygonindexes = {};

		var xcoordinatebins = {};
		var ycoordinatebins = {};

		// convert all polygon vertices to 2D
		// Make a list of all encountered y coordinates
		// And build a map of all polygons that have a vertex at a certain y coordinate:
		var ycoordinateBinningFactor = 1.0 / EPS * 10;
		for(var polygonindex = 0; polygonindex < numpolygons; polygonindex++) {
			var poly3d = sourcepolygons[polygonindex];
			var vertices2d = [];
			var numvertices = poly3d.vertices.length;
			var minindex = -1;
			if(numvertices > 0) {
				var miny, maxy, maxindex;
				for(var i = 0; i < numvertices; i++) {
					var pos2d = orthobasis.to2D(poly3d.vertices[i].pos);
					// perform binning of y coordinates: If we have multiple vertices very
					// close to each other, give them the same y coordinate:
					var ycoordinatebin = Math.floor(pos2d.y * ycoordinateBinningFactor);
					var newy;
					if(ycoordinatebin in ycoordinatebins) {
						newy = ycoordinatebins[ycoordinatebin];
					} else if(ycoordinatebin + 1 in ycoordinatebins) {
						newy = ycoordinatebins[ycoordinatebin + 1];
					} else if(ycoordinatebin - 1 in ycoordinatebins) {
						newy = ycoordinatebins[ycoordinatebin - 1];
					} else {
						newy = pos2d.y;
						ycoordinatebins[ycoordinatebin] = pos2d.y;
					}
					pos2d = new CSG.Vector2D(pos2d.x, newy);
					vertices2d.push(pos2d);
					var y = pos2d.y;
					if((i === 0) || (y < miny)) {
						miny = y;
						minindex = i;
					}
					if((i === 0) || (y > maxy)) {
						maxy = y;
						maxindex = i;
					}
					if(!(y in ycoordinatetopolygonindexes)) {
						ycoordinatetopolygonindexes[y] = {};
					}
					ycoordinatetopolygonindexes[y][polygonindex] = true;
				}
				if(miny >= maxy) {
					// degenerate polygon, all vertices have same y coordinate. Just ignore it from now:
					vertices2d = [];
				} else {
					if(!(miny in topy2polygonindexes)) {
						topy2polygonindexes[miny] = [];
					}
					topy2polygonindexes[miny].push(polygonindex);
				}
			} // if(numvertices > 0)
			// reverse the vertex order:
			vertices2d.reverse();
			minindex = numvertices - minindex - 1;
			polygonvertices2d.push(vertices2d);
			polygontopvertexindexes.push(minindex);
		}
		var ycoordinates = [];
		for(var ycoordinate in ycoordinatetopolygonindexes) ycoordinates.push(ycoordinate);
		ycoordinates.sort(fnNumberSort);

		// Now we will iterate over all y coordinates, from lowest to highest y coordinate
		// activepolygons: source polygons that are 'active', i.e. intersect with our y coordinate
		//   Is sorted so the polygons are in left to right order
		// Each element in activepolygons has these properties:
		//        polygonindex: the index of the source polygon (i.e. an index into the sourcepolygons
		//                      and polygonvertices2d arrays)
		//        leftvertexindex: the index of the vertex at the left side of the polygon (lowest x)
		//                         that is at or just above the current y coordinate
		//        rightvertexindex: dito at right hand side of polygon
		//        topleft, bottomleft: coordinates of the left side of the polygon crossing the current y coordinate
		//        topright, bottomright: coordinates of the right hand side of the polygon crossing the current y coordinate
		var activepolygons = [];
		var prevoutpolygonrow = [];
		for(var yindex = 0; yindex < ycoordinates.length; yindex++) {
			var newoutpolygonrow = [];
			var ycoordinate_as_string = ycoordinates[yindex];
			var ycoordinate = Number(ycoordinate_as_string);

			// update activepolygons for this y coordinate:
			// - Remove any polygons that end at this y coordinate
			// - update leftvertexindex and rightvertexindex (which point to the current vertex index
			//   at the the left and right side of the polygon
			// Iterate over all polygons that have a corner at this y coordinate:
			var polygonindexeswithcorner = ycoordinatetopolygonindexes[ycoordinate_as_string];
			for(var activepolygonindex = 0; activepolygonindex < activepolygons.length; ++activepolygonindex) {
				var activepolygon = activepolygons[activepolygonindex];
				var polygonindex = activepolygon.polygonindex;
				if(polygonindexeswithcorner[polygonindex]) {
					// this active polygon has a corner at this y coordinate:
					var vertices2d = polygonvertices2d[polygonindex];
					var numvertices = vertices2d.length;
					var newleftvertexindex = activepolygon.leftvertexindex;
					var newrightvertexindex = activepolygon.rightvertexindex;
					// See if we need to increase leftvertexindex or decrease rightvertexindex:
					while(true) {
						var nextleftvertexindex = newleftvertexindex + 1;
						if(nextleftvertexindex >= numvertices) nextleftvertexindex = 0;
						if(vertices2d[nextleftvertexindex].y != ycoordinate) break;
						newleftvertexindex = nextleftvertexindex;
					}
					var nextrightvertexindex = newrightvertexindex - 1;
					if(nextrightvertexindex < 0) nextrightvertexindex = numvertices - 1;
					if(vertices2d[nextrightvertexindex].y == ycoordinate) {
						newrightvertexindex = nextrightvertexindex;
					}
					if((newleftvertexindex != activepolygon.leftvertexindex) && (newleftvertexindex == newrightvertexindex)) {
						// We have increased leftvertexindex or decreased rightvertexindex, and now they point to the same vertex
						// This means that this is the bottom point of the polygon. We'll remove it:
						activepolygons.splice(activepolygonindex, 1);
						--activepolygonindex;
					} else {
						activepolygon.leftvertexindex = newleftvertexindex;
						activepolygon.rightvertexindex = newrightvertexindex;
						activepolygon.topleft = vertices2d[newleftvertexindex];
						activepolygon.topright = vertices2d[newrightvertexindex];
						var nextleftvertexindex = newleftvertexindex + 1;
						if(nextleftvertexindex >= numvertices) nextleftvertexindex = 0;
						activepolygon.bottomleft = vertices2d[nextleftvertexindex];
						var nextrightvertexindex = newrightvertexindex - 1;
						if(nextrightvertexindex < 0) nextrightvertexindex = numvertices - 1;
						activepolygon.bottomright = vertices2d[nextrightvertexindex];
					}
				} // if polygon has corner here
			} // for activepolygonindex
			var nextycoordinate;
			if(yindex >= ycoordinates.length - 1) {
				// last row, all polygons must be finished here:
				activepolygons = [];
				nextycoordinate = null;
			} else // yindex < ycoordinates.length-1
			{
				nextycoordinate = Number(ycoordinates[yindex + 1]);
				var middleycoordinate = 0.5 * (ycoordinate + nextycoordinate);
				// update activepolygons by adding any polygons that start here:
				var startingpolygonindexes = topy2polygonindexes[ycoordinate_as_string];
				for(var polygonindex_key in startingpolygonindexes) {
					var polygonindex = startingpolygonindexes[polygonindex_key];
					var vertices2d = polygonvertices2d[polygonindex];
					var numvertices = vertices2d.length;
					var topvertexindex = polygontopvertexindexes[polygonindex];
					// the top of the polygon may be a horizontal line. In that case topvertexindex can point to any point on this line.
					// Find the left and right topmost vertices which have the current y coordinate:
					var topleftvertexindex = topvertexindex;
					while(true) {
						var i = topleftvertexindex + 1;
						if(i >= numvertices) i = 0;
						if(vertices2d[i].y != ycoordinate) break;
						if(i == topvertexindex) break; // should not happen, but just to prevent endless loops
						topleftvertexindex = i;
					}
					var toprightvertexindex = topvertexindex;
					while(true) {
						var i = toprightvertexindex - 1;
						if(i < 0) i = numvertices - 1;
						if(vertices2d[i].y != ycoordinate) break;
						if(i == topleftvertexindex) break; // should not happen, but just to prevent endless loops
						toprightvertexindex = i;
					}
					var nextleftvertexindex = topleftvertexindex + 1;
					if(nextleftvertexindex >= numvertices) nextleftvertexindex = 0;
					var nextrightvertexindex = toprightvertexindex - 1;
					if(nextrightvertexindex < 0) nextrightvertexindex = numvertices - 1;
					var newactivepolygon = {
						polygonindex: polygonindex,
						leftvertexindex: topleftvertexindex,
						rightvertexindex: toprightvertexindex,
						topleft: vertices2d[topleftvertexindex],
						topright: vertices2d[toprightvertexindex],
						bottomleft: vertices2d[nextleftvertexindex],
						bottomright: vertices2d[nextrightvertexindex],
					};
					insertSorted(activepolygons, newactivepolygon, function(el1, el2) {
						var x1 = CSG.interpolateBetween2DPointsForY(
									el1.topleft, el1.bottomleft, middleycoordinate);
						var x2 = CSG.interpolateBetween2DPointsForY(
									el2.topleft, el2.bottomleft, middleycoordinate);
						if(x1 > x2) return 1;
						if(x1 < x2) return -1;
						return 0;
					});
				} // for(var polygonindex in startingpolygonindexes)
			} //  yindex < ycoordinates.length-1
			//if( (yindex == ycoordinates.length-1) || (nextycoordinate - ycoordinate > EPS) )
			if(true) {
				// Now activepolygons is up to date
				// Build the output polygons for the next row in newoutpolygonrow:
				for(var activepolygon_key in activepolygons) {
					var activepolygon = activepolygons[activepolygon_key];
					var polygonindex = activepolygon.polygonindex;
					var vertices2d = polygonvertices2d[polygonindex];
					var numvertices = vertices2d.length;

					var x = CSG.interpolateBetween2DPointsForY(activepolygon.topleft, activepolygon.bottomleft, ycoordinate);
					var topleft = new CSG.Vector2D(x, ycoordinate);
					x = CSG.interpolateBetween2DPointsForY(activepolygon.topright, activepolygon.bottomright, ycoordinate);
					var topright = new CSG.Vector2D(x, ycoordinate);
					x = CSG.interpolateBetween2DPointsForY(activepolygon.topleft, activepolygon.bottomleft, nextycoordinate);
					var bottomleft = new CSG.Vector2D(x, nextycoordinate);
					x = CSG.interpolateBetween2DPointsForY(activepolygon.topright, activepolygon.bottomright, nextycoordinate);
					var bottomright = new CSG.Vector2D(x, nextycoordinate);
					var outpolygon = {
						topleft: topleft,
						topright: topright,
						bottomleft: bottomleft,
						bottomright: bottomright,
						leftline: CSG.Line2D.fromPoints(topleft, bottomleft),
						rightline: CSG.Line2D.fromPoints(bottomright, topright)
					};
					if(newoutpolygonrow.length > 0) {
						var prevoutpolygon = newoutpolygonrow[newoutpolygonrow.length - 1];
						var d1 = outpolygon.topleft.distanceTo(prevoutpolygon.topright);
						var d2 = outpolygon.bottomleft.distanceTo(prevoutpolygon.bottomright);
						if((d1 < EPS) && (d2 < EPS)) {
							// we can join this polygon with the one to the left:
							outpolygon.topleft = prevoutpolygon.topleft;
							outpolygon.leftline = prevoutpolygon.leftline;
							outpolygon.bottomleft = prevoutpolygon.bottomleft;
							newoutpolygonrow.splice(newoutpolygonrow.length - 1, 1);
						}
					}
					newoutpolygonrow.push(outpolygon);
				} // for(activepolygon in activepolygons)
				if(yindex > 0) {
					// try to match the new polygons against the previous row:
					var prevcontinuedindexes = {};
					var matchedindexes = {};
					for(var i = 0; i < newoutpolygonrow.length; i++) {
						var thispolygon = newoutpolygonrow[i];
						for(var ii = 0; ii < prevoutpolygonrow.length; ii++) {
							if(!matchedindexes[ii]) // not already processed?
							{
								// We have a match if the sidelines are equal or if the top coordinates
								// are on the sidelines of the previous polygon
								var prevpolygon = prevoutpolygonrow[ii];
								if(prevpolygon.bottomleft.distanceTo(thispolygon.topleft) < EPS) {
									if(prevpolygon.bottomright.distanceTo(thispolygon.topright) < EPS) {
										// Yes, the top of this polygon matches the bottom of the previous:
										matchedindexes[ii] = true;
										// Now check if the joined polygon would remain convex:
										var d1 = thispolygon.leftline.direction().x - prevpolygon.leftline.direction().x;
										var d2 = thispolygon.rightline.direction().x - prevpolygon.rightline.direction().x;
										var leftlinecontinues = Math.abs(d1) < EPS;
										var rightlinecontinues = Math.abs(d2) < EPS;
										var leftlineisconvex = leftlinecontinues || (d1 >= 0);
										var rightlineisconvex = rightlinecontinues || (d2 >= 0);
										if(leftlineisconvex && rightlineisconvex) {
											// yes, both sides have convex corners:
											// This polygon will continue the previous polygon
											thispolygon.outpolygon = prevpolygon.outpolygon;
											thispolygon.leftlinecontinues = leftlinecontinues;
											thispolygon.rightlinecontinues = rightlinecontinues;
											prevcontinuedindexes[ii] = true;
										}
										break;
									}
								}
							} // if(!prevcontinuedindexes[ii])
						} // for ii
					} // for i
					for(var ii = 0; ii < prevoutpolygonrow.length; ii++) {
						if(!prevcontinuedindexes[ii]) {
							// polygon ends here
							// Finish the polygon with the last point(s):
							var prevpolygon = prevoutpolygonrow[ii];
							prevpolygon.outpolygon.rightpoints.push(prevpolygon.bottomright);
							if(prevpolygon.bottomright.distanceTo(prevpolygon.bottomleft) > EPS) {
								// polygon ends with a horizontal line:
								prevpolygon.outpolygon.leftpoints.push(prevpolygon.bottomleft);
							}
							// reverse the left half so we get a counterclockwise circle:
							prevpolygon.outpolygon.leftpoints.reverse();
							var points2d = prevpolygon.outpolygon.rightpoints.concat(prevpolygon.outpolygon.leftpoints);
							var vertices3d = [];
							points2d.map(function(point2d) {
								var point3d = orthobasis.to3D(point2d);
								var vertex3d = new CSG.Vertex(point3d);
								vertices3d.push(vertex3d);
							});
							var polygon = new CSG.Polygon(vertices3d, shared, plane);
							destpolygons.push(polygon);
						}
					}
				} // if(yindex > 0)
				for(var i = 0; i < newoutpolygonrow.length; i++) {
					var thispolygon = newoutpolygonrow[i];
					if(!thispolygon.outpolygon) {
						// polygon starts here:
						thispolygon.outpolygon = {
							leftpoints: [],
							rightpoints: []
						};
						thispolygon.outpolygon.leftpoints.push(thispolygon.topleft);
						if(thispolygon.topleft.distanceTo(thispolygon.topright) > EPS) {
							// we have a horizontal line at the top:
							thispolygon.outpolygon.rightpoints.push(thispolygon.topright);
						}
					} else {
						// continuation of a previous row
						if(!thispolygon.leftlinecontinues) {
							thispolygon.outpolygon.leftpoints.push(thispolygon.topleft);
						}
						if(!thispolygon.rightlinecontinues) {
							thispolygon.outpolygon.rightpoints.push(thispolygon.topright);
						}
					}
				}
				prevoutpolygonrow = newoutpolygonrow;
			}
		} // for yindex
	} // if(numpolygons > 0)
};

require('./fuzzyFactory')(CSG)
require('./fuzzyCSGFactory')(CSG)

CSG.Properties = require('./Properties')
CSG.getTag = require('./tag')
CSG.Connector = require('./Connector')

require('./path2D')(CSG)

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

// CSG.Polygon2D = require('./polygon2D')

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
