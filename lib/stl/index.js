module.exports = {
    // parseBinary: parseBinarySTL,
    // parseAsciiSTL: parseAsciiSTL,
    parse: parseSTL
}

function parseSTL(stl,fn) {
   var isAscii = true;

   for(var i=0; i<stl.length; i++) {
      if(stl[i].charCodeAt(0) == 0) {
         isAscii = false;
         break;
      }
   }
   //echo("STL:"+fn,isAscii?"ascii":"binary");
   var src;
   if(!isAscii) {
      src = parseBinarySTL(stl,fn);

        // var it = parseBinarySTLG()

        // console.log(it.next())
        // let normal = it.next()
        // let v1 = it.next()
        //, v2, v3 = it.next(), it.next(), it.next(), it.next()
        // console.log(normal, v1, v2, v3)


   } else {
      src = parseAsciiSTL(stl,fn);
   }
   //echo("STL converted JSCAD",src);
   return src;
}

var CSG = require('../scad').CSG,
    BinaryReader = require('./binary-reader')


// function *parseBinarySTLG(stl){
//     var br = new BinaryReader(stl);
//
//     br.seek(80); //Skip header
//
//     var totalTriangles = br.readUInt32(); //Read # triangles
//     console.time('loop')
//     for (var tr = 0; tr < totalTriangles; tr++) {
//         /*
//              REAL32[3] . Normal vector
//              REAL32[3] . Vertex 1
//              REAL32[3] . Vertex 2
//              REAL32[3] . Vertex 3
//                 UINT16 . Attribute byte count */
//         // -- Parse normal
//         // var no = [];
//         yield [br.readFloat(), br.readFloat(), br.readFloat()]
//
//
//         // -- Parse every 3 subsequent floats as a vertex
//         // v1
//         yield [br.readFloat(),br.readFloat(),br.readFloat()]
//         // v2
//         yield [br.readFloat(),br.readFloat(),br.readFloat()]
//         // v3
//         yield [br.readFloat(),br.readFloat(),br.readFloat()]
//
//         // var skip = 0;
//         // if (1) {
//         //     for (var i = 0; i < 3; i++) {
//         //         if (isNaN(v1[i])) skip++;
//         //         if (isNaN(v2[i])) skip++;
//         //         if (isNaN(v3[i])) skip++;
//         //         if (isNaN(no[i])) skip++;
//         //     }
//         //     if (skip > 0) {
//         //         console.log("bad triangle vertice coords/normal: ", skip);
//         //     }
//         // }
//         // err += skip;
//         // -- every 3 vertices create a triangle.
//         // var triangle = [];
//         // triangle.push(vertexIndex++);
//         // triangle.push(vertexIndex++);
//         // triangle.push(vertexIndex++);
//
//         br.readUInt16();
//
//         // -- Add 3 vertices for every triangle
//         // -- TODO: OPTIMIZE: Check if the vertex is already in the array, if it is just reuse the index
//         if (skip == 0) { // checking cw vs ccw, given all normal/vertice are valid
//             // E1 = B - A
//             // E2 = C - A
//             // test = dot( Normal, cross( E1, E2 ) )
//             // test > 0: cw, test < 0 : ccw
//             var w1 = new CSG.Vector3D(v1);
//             var w2 = new CSG.Vector3D(v2);
//             var w3 = new CSG.Vector3D(v3);
//             var e1 = w2.minus(w1);
//             var e2 = w3.minus(w1);
//             var t = new CSG.Vector3D(no).dot(e1.cross(e2));
//             if (t > 0) { // 1,2,3 -> 3,2,1
//                 var tmp = v3;
//                 v3 = v1;
//                 v1 = tmp;
//             }
//         }
//         // vertices.push(v1);
//         // vertices.push(v2);
//         // vertices.push(v3);
//         // triangles.push(triangle);
//         // normals.push(no);
//         // converted++;
//
//         // console.log(converted)
//     }
//     console.timeEnd('loop')
//
//     // var p = {
//     //     points: vertices,
//     //     triangles: triangles,
//     //     normals: normals
//     // }
//     // console.time('polyhedron')
//     // var csg = polyhedron(p)
//     // console.timeEnd('polyhedron')
//     //     //console.log(csg)
//     //     //console.log(csg.getBounds())
//     // return csg;
// }

function parseBinarySTL(stl, fn) {
    // -- This makes more sense if you read http://en.wikipedia.org/wiki/STL_(file_format)#Binary_STL
    var vertices = [];
    var triangles = [];
    var normals = [];
    var vertexIndex = 0;
    var converted = 0;
    var err = 0;
    var br = new BinaryReader(stl);

    br.seek(80); //Skip header

    var totalTriangles = br.readUInt32(); //Read # triangles
    // console.time('loop')
    for (var tr = 0; tr < totalTriangles; tr++) {
        //if(tr%100==0) status('stl importer: converted '+converted+' out of '+totalTriangles+' triangles');
        /*
             REAL32[3] . Normal vector
             REAL32[3] . Vertex 1
             REAL32[3] . Vertex 2
             REAL32[3] . Vertex 3
                UINT16 . Attribute byte count */
        // -- Parse normal
        var no = [];
        var f = br.readFloat()
        if (isNaN(f)){
            console.log('ops')
        }
        no.push(f);
        f = br.readFloat()
        if (isNaN(f)){
            console.log('ops')
        }
        no.push(f);
        f = br.readFloat()
        if (isNaN(f)){
            console.log('ops')
        }
        no.push(f);

        // -- Parse every 3 subsequent floats as a vertex
        var v1 = [];
        v1.push(br.readFloat());
        v1.push(br.readFloat());
        v1.push(br.readFloat());
        var v2 = [];
        v2.push(br.readFloat());
        v2.push(br.readFloat());
        v2.push(br.readFloat());
        var v3 = [];
        v3.push(br.readFloat());
        v3.push(br.readFloat());
        v3.push(br.readFloat());

        var skip = 0;
        if (1) {
            for (var i = 0; i < 3; i++) {
                if (isNaN(v1[i])) skip++;
                if (isNaN(v2[i])) skip++;
                if (isNaN(v3[i])) skip++;
                if (isNaN(no[i])) skip++;
            }
            if (skip > 0) {
                console.log("bad triangle vertice coords/normal: ", skip);
            }
        }
        err += skip;
        // -- every 3 vertices create a triangle.
        var triangle = [];
        triangle.push(vertexIndex++);
        triangle.push(vertexIndex++);
        triangle.push(vertexIndex++);

        br.readUInt16();

        // -- Add 3 vertices for every triangle
        // -- TODO: OPTIMIZE: Check if the vertex is already in the array, if it is just reuse the index
        if (skip == 0) { // checking cw vs ccw, given all normal/vertice are valid
            // E1 = B - A
            // E2 = C - A
            // test = dot( Normal, cross( E1, E2 ) )
            // test > 0: cw, test < 0 : ccw
            var w1 = new CSG.Vector3D(v1);
            var w2 = new CSG.Vector3D(v2);
            var w3 = new CSG.Vector3D(v3);
            var e1 = w2.minus(w1);
            var e2 = w3.minus(w1);
            var t = new CSG.Vector3D(no).dot(e1.cross(e2));
            if (t > 0) { // 1,2,3 -> 3,2,1
                var tmp = v3;
                v3 = v1;
                v1 = tmp;
            }
        }
        vertices.push(v1);
        vertices.push(v2);
        vertices.push(v3);
        triangles.push(triangle);
        normals.push(no);
        converted++;

        // console.log(converted)
    }
    // console.timeEnd('loop')

    var p = {
        points: vertices,
        triangles: triangles,
        normals: normals
    }
    // console.time('polyhedron')
    var csg = polyhedron(p)
    // console.timeEnd('polyhedron')
        //console.log(csg)
        //console.log(csg.getBounds())
    return csg;
}

function parseAsciiSTL(stl, fn) {
    var src = "";
    var n = 0;
    var converted = 0;
    var o;

    // src += "// producer: OpenJSCAD "+me.toUpperCase()+" "+version+" STL ASCII Importer\n";
    // src += "// date: "+(new Date())+"\n";
    // src += "// source: "+fn+"\n";
    // src += "\n";
    //  src += "function main() { return union(\n";
    //  // -- Find all models
    var objects = stl.split('endsolid');
    // src += "// objects: "+(objects.length-1)+"\n";

    for (o = 1; o < objects.length; o++) {
        // -- Translation: a non-greedy regex for facet {...} endloop pattern
        var patt = /\bfacet[\s\S]*?endloop/mgi;
        var vertices = [];
        var triangles = [];
        var normals = [];
        var vertexIndex = 0;
        var err = 0;

        let match = stl.match(patt);
        if (match == null) continue;
        for (var i = 0; i < match.length; i++) {
            //if(converted%100==0) status('stl to jscad: converted '+converted+' out of '+match.length+ ' facets');
            // -- 1 normal with 3 numbers, 3 different vertex objects each with 3 numbers:
            //var vpatt = /\bfacet\s+normal\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*outer\s+loop\s+vertex\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*vertex\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s*vertex\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/mgi;
            // (-?\d+\.?\d*) -1.21223
            // (-?\d+\.?\d*[Ee]?[-+]?\d*)
            var vpatt = /\bfacet\s+normal\s+(\S+)\s+(\S+)\s+(\S+)\s+outer\s+loop\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s+vertex\s+(\S+)\s+(\S+)\s+(\S+)\s*/mgi;
            var v = vpatt.exec(match[i]);
            if (v == null) continue;
            if (v.length != 13) {
                console.log("Failed to parse " + match[i]);
                break;
            }
            var skip = 0;
            for (var k = 0; k < v.length; k++) {
                if (v[k] == 'NaN') {
                    console.log("bad normal or triangle vertice #" + converted + " " + k + ": '" + v[k] + "', skipped");
                    skip++;
                }
            }
            err += skip;
            if (skip) {
                continue;
            }
            if (0 && skip) {
                var j = 1 + 3;
                var v1 = [];
                v1.push(parseFloat(v[j++]));
                v1.push(parseFloat(v[j++]));
                v1.push(parseFloat(v[j++]));
                var v2 = [];
                v2.push(parseFloat(v[j++]));
                v2.push(parseFloat(v[j++]));
                v2.push(parseFloat(v[j++]));
                var v3 = [];
                v3.push(parseFloat(v[j++]));
                v3.push(parseFloat(v[j++]));
                v3.push(parseFloat(v[j++]));
                echo("recalculate norm", v1, v2, v3);
                var w1 = new CSG.Vector3D(v1);
                var w2 = new CSG.Vector3D(v2);
                var w3 = new CSG.Vector3D(v3);
                var _u = w1.minus(w3);
                var _v = w1.minus(w2);
                var norm = _u.cross(_v).unit();
                j = 1;
                v[j++] = norm._x;
                v[j++] = norm._y;
                v[j++] = norm._z;
                skip = false;
            }
            var j = 1;
            var no = [];
            no.push(parseFloat(v[j++]));
            no.push(parseFloat(v[j++]));
            no.push(parseFloat(v[j++]));
            var v1 = [];
            v1.push(parseFloat(v[j++]));
            v1.push(parseFloat(v[j++]));
            v1.push(parseFloat(v[j++]));
            var v2 = [];
            v2.push(parseFloat(v[j++]));
            v2.push(parseFloat(v[j++]));
            v2.push(parseFloat(v[j++]));
            var v3 = [];
            v3.push(parseFloat(v[j++]));
            v3.push(parseFloat(v[j++]));
            v3.push(parseFloat(v[j++]));
            var triangle = [];
            triangle.push(vertexIndex++);
            triangle.push(vertexIndex++);
            triangle.push(vertexIndex++);

            // -- Add 3 vertices for every triangle
            //    TODO: OPTIMIZE: Check if the vertex is already in the array, if it is just reuse the index
            if (skip == 0) { // checking cw vs ccw
                // E1 = B - A
                // E2 = C - A
                // test = dot( Normal, cross( E1, E2 ) )
                // test > 0: cw, test < 0: ccw
                var w1 = new CSG.Vector3D(v1);
                var w2 = new CSG.Vector3D(v2);
                var w3 = new CSG.Vector3D(v3);
                var e1 = w2.minus(w1);
                var e2 = w3.minus(w1);
                var t = new CSG.Vector3D(no).dot(e1.cross(e2));
                if (t > 0) { // 1,2,3 -> 3,2,1
                    var tmp = v3;
                    v3 = v1;
                    v1 = tmp;
                }
            }
            vertices.push(v1);
            vertices.push(v2);
            vertices.push(v3);
            normals.push(no);
            triangles.push(triangle);
            converted++;
        }
        // if(n++) src += ",";
        // if(err) src += "// WARNING: import errors: "+err+" (some triangles might be misaligned or missing)\n";
        // src += "// object #"+(o)+": triangles: "+match.length+"\n";
        // src += vt2jscad(vertices,triangles,normals);

        // console.log('t', triangles.length)
        // console.log('v', vertices.length)
    }

    // console.log(triangles[0])
    // console.log(vertices[0])
    // src += "); }\n";
    var p = {
        points: vertices,
        triangles: triangles,
        normals: normals
    }

    // var csg = CSG.fromPolygons(pgs);
    // return csg
    return polyhedron(p)
        //console.log(csg)
        //console.log(csg.getBounds())
    // return csg;
}

function polyhedron(p) {
    var pgs = [];
    var ref = p.triangles || p.polygons;

    for (var i = 0; i < ref.length; i++) {
        var pp = []
        for (var j = 0; j < ref[i].length; j++) {
            pp.push(p.points[ref[i][j]])
        }
        let nn = p.normals[i]

        var v = []
        for (j = ref[i].length - 1; j >= 0; j--) { // --- we reverse order for examples of OpenSCAD work
            //for(var j=0; j<ref[i].length-1; j++) {
            v.push(new CSG.Vertex(new CSG.Vector3D(pp[j][0], pp[j][1], pp[j][2])))
        }
        let normal = new CSG.Vector3D(nn[0], nn[1], nn[2])
        let plane = CSG.Plane.fromNormalAndPoint(normal, v[0].pos)
        var poly = new CSG.Polygon(v, null, plane)
        pgs.push(poly)
    }
    var r = CSG.fromPolygons(pgs)
    return r;
}

function vt2jscad(v, t, n, c) { // vertices, triangles, normals and colors
    var src = '';
    src += "polyhedron({ points: [\n\t";
    for (var i = 0, j = 0; i < v.length; i++) {
        if (j++) src += ",\n\t";
        src += "[" + v[i] + "]"; //.join(", ");
    }
    src += "],\n\tpolygons: [\n\t";
    for (var i = 0, j = 0; i < t.length; i++) {
        if (j++) src += ",\n\t";
        src += "[" + t[i] + "]"; //.join(', ');
    }
    src += "] })\n";
    return src;
    //return polyhedron({points:vertices, triangles: triangles});
}
