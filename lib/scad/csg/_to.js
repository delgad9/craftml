module.exports = {

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
