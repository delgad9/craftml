module.exports = {

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
                if (!(vertextag in vertexmap)) {
                    vertexmap[vertextag] = numvertices++;
                    vertices.push(v);
                }
            });

            var planetag = p.plane.getTag();
            if (!(planetag in planemap)) {
                planemap[planetag] = numplanes++;
                planes.push(p.plane);
            }
            var sharedtag = p.shared.getTag();
            if (!(sharedtag in sharedmap)) {
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
        for (var polygonindex = 0; polygonindex < numpolygons; ++polygonindex) {
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

    // For debugging
    // Creates a new solid with a tiny cube at every vertex of the source solid
    toPointCloud: function(cuberadius) {
        var cube = require('./shapes/cube')
        var csg = this.reTesselated();

        var result = null

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
            var c = cube({
                center: pos,
                radius: cuberadius
            });
            if (result){
                result = result.unionSub(c, false, false);
            } else {
                result = c
            }
        }

        result = result.reTesselated();
        return result;
    }

}
