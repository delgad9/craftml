var ProtoBuf = require("protobufjs");

var builder = ProtoBuf.loadProtoFile(__dirname + "/solid.proto"),
    SolidProto = builder.build("Craftml").Solid

var GPolygon = require('../scad/geometry/Polygon')
var GVertex = require('../scad/geometry/Vertex')
var GVector3D = require('../scad/geometry/Vector3D')

import fs from 'fs'

import _ from 'lodash'

function simplify(solid, flipped = solid.flipped){
    var s = _.pick(solid, ['type', 'm', 'layout'])
    s.layout = _.pick(solid.layout, ['size', 'position'])
    s.style = _.pairs(solid.style)
    s.type = 'solid'

    if (solid.flipped){
        flipped = !flipped
    }

    let buffer
    if (solid.csg) {
        // console.log('flipped', solid.flipped)
        var csg = solid.csg
        if (csg.properties.type == 'lines') {
            buffer = csg.toFloat32ArrayLines()
        } else {
            buffer = csg.toFloat32ArrayMesh(flipped)
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

export function save(){
    // var p = new Polygon({ vertices: [{x: 1,y: 2,z: 3},{x: 1,y: 2,z: 3}]})

    // var byteBuffer = car.encode()
    // console.log(this.csg.polygons[0].vertices[0])

    // let vs = this.csg.polygons[0].vertices

    var s = simplify(this, this.flipped)
    // console.log(s)

    // var s = _.pick(this, ['type', 'm', 'layout'])
    // s.layout = _.pick(this.layout, ['size', 'position'])

    if (0){
        function convert(v){
            return {x: v._x, y: v._y, z: v._z}
        }

        s.polygons = _.map(this.csg.polygons, poly => {
                let p = {}
                p.vertices = _.map(_.pluck(poly.vertices,'pos'), convert)
                p.normal = convert(poly.plane.normal)
                return p
        })
    }



    var p  = new SolidProto(s)

    var buf = p.encode()

    var wstream = fs.createWriteStream('test.bin')
    // wstream.write(buf.toBuffer())
    // wstream.end()

    return buf.toBuffer()


    // var Buffer = require('Buffer')

    if (0){
    var res = fs.createReadStream('test.bin')
    // readStream
    var data = []; // List of Buffer objects
      res.on("data", function(chunk) {
          data.push(chunk); // Append Buffer object
      });
      res.on("end", function() {
          data = Buffer.concat(data); // Make one large Buffer of it
          var p1 = SolidProto.decode(data);
          console.log(p1)

      })
  }

    // var p1 = SolidProto.decode(rstream)
    // console.log(p1)

    // console.log(buf.toBuffer().length)

    // fs.write('test.bin', buf.toBuffer(), {encoding: 'binary'}, function(err){
    //     if (err) throw err;
    //     console.log('It\'s saved!');
    // })

    // var f = fs.createWriteStream('./output.bin')
    // console.log(buf.toBuffer())// f.write(buf.toArrayBuffer())

    // var p1 = SolidProto.decode(buf);//buffer);

    // let proto = this.csg.polygons[0].prototype

    // fs.writeFile()




    // this.csg.polygons[0] = p1
    // p1.prototype = proto
    // console.log(JSON.stringify(p1,null,' '))//.style)

    // console.log(vs[0])
    //
    // this.csg.polygons[0].vertices = _.map(p1.vertices, v => {
    //     let v1 = new GVertex(new GVector3D(v.pos._x, v.pos._y, v.pos._z))//.prototype, v)
    //     // v1.pos = _.assign(Object.create(GVector3D.prototype), v.pos)//
    //     // console.log(new GVector3D(v.pos._x, v.pos._y, v.pos._z))//.prototype))
    //     // console.log(_.extend(new GVector3D(), v.pos))
    //     // _.
    //     // , v.pos)
    //     return v1
    // })// = Object.create(GPolygon.prototype, p1)
    // _.extends.__proto__ = proto

    // console.log(p1)

}
