var ProtoBuf = require("protobufjs");

//var builder = ProtoBuf.loadProtoFile(__dirname + "/solid.proto"),
var builder = ProtoBuf.loadJson(require('./solid.proto.json')),
    SolidProto = builder.build("Craftml").Solid

var GPolygon = require('../scad/geometry/Polygon')
var GVertex = require('../scad/geometry/Vertex')
var GVector3D = require('../scad/geometry/Vector3D')

import fs from 'fs'

import _ from 'lodash'

function simplify(solid, flipped = solid.flipped){
    var s = _.pick(solid, ['name', 'm', 'layout','role'])
    s.layout = _.pick(solid.layout, ['size', 'position'])
    // s.style = _.pairs(solid.style)
    s.style = solid.style
    // s.type = 'solid'

    if (solid.flipped){
        flipped = !flipped
    }

    let buffer
    if (solid.csg) {
        // console.log('flipped', solid.flipped)
        var csg = solid.csg
        if (solid.role == 'cag') {

            buffer = csg.toFloat32ArrayLines()

        } else {
            //buffer = csg.toFloat32ArrayMesh(flipped)
            if (solid.indices){
                buffer = toFloat32ArrayMesh(solid.csg.polygons, solid.indices, flipped)
            } else {
                buffer = csg.toFloat32ArrayMesh(flipped)
            }
        }

        s.buffer = {}
        s.buffer.vertices = Array.prototype.slice.call(buffer.vertices)
        s.buffer.normals = Array.prototype.slice.call(buffer.normals)
    }

    s.children = _.map(solid.children, c => {
        return simplify(c, flipped)
    })
    return s
}

export function preview(){
    //this.apply()
    return simplify(this, this.flipped)
}

export function save(){

    var s = simplify(this, this.flipped)
    // this.pp()

    // console.log(_.isString(s.name))
    // console.log(JSON.stringify(s,null,' '))
    var p  = new SolidProto(s)

    var buf = p.encode()

    // var wstream = fs.createWriteStream('test.bin')
    // wstream.write(buf.toBuffer())
    // wstream.end()

    return buf.toBuffer()


    // var Buffer = require('Buffer')

    // if (0){
    // var res = fs.createReadStream('test.bin')
    // // readStream
    // var data = []; // List of Buffer objects
    //   res.on("data", function(chunk) {
    //       data.push(chunk); // Append Buffer object
    //   });
    //   res.on("end", function() {
    //       data = Buffer.concat(data); // Make one large Buffer of it
    //       var p1 = SolidProto.decode(data);
    //       console.log(p1)
    //
    //   })
  // }
}

function toFloat32ArrayMesh(polygons, indices, flipped = false) {

    let numvertices = 0
    _.forEach(indices, id => {

        let d = (polygons[id].vertices.length - 2) * 3
        numvertices += d

    })

    let vertexData = new Float32Array(numvertices * 3),
        normalData = new Float32Array(numvertices * 3)

    var verticesArrayIndex = 0
    function push(vertex, n){
        var pos = vertex.pos;
        vertexData[verticesArrayIndex] = pos._x;
        vertexData[verticesArrayIndex+1] = pos._y;
        vertexData[verticesArrayIndex+2] = pos._z;
        normalData[verticesArrayIndex] = n._x;
        normalData[verticesArrayIndex+1] = n._y;
        normalData[verticesArrayIndex+2] = n._z;
        verticesArrayIndex += 3
    }

    _.forEach(indices, id => {

        let p = polygons[id]

        let firstVertex = p.vertices[0]
        let n = p.plane.normal
        for (var i = 0; i < p.vertices.length - 2; i++) {

            push(firstVertex, n)
            if (!flipped){
                push(p.vertices[i + 2], n)
                push(p.vertices[i + 1], n)
            } else {
                push(p.vertices[i + 1], n)
                push(p.vertices[i + 2], n)
            }
        }

    })

    return {
        vertices: vertexData,
        normals: normalData
    }
}
