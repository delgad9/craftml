var ProtoBuf = dcodeIO.ProtoBuf;
// var builder = ProtoBuf.loadJson(proto)
var SolidProto = _root.Craftml.Solid

function load(title, cb){

    // title === 'examples primitives cube.xml'

    var name = title.split(' ').slice(1).join('/') + '.new'
    // name === 'primitives/cube.xml.new'

    var xhr = ProtoBuf.Util.XHR();
    xhr.open(
        /* method */ "GET",
        /* file */ "../output/" + name + '.d3d',
        /* async */ true
    );
    xhr.responseType = "arraybuffer";
    xhr.onload = function(evt) {
        console.log(xhr.response)
        var solid = SolidProto.decode(xhr.response);
        console.log(solid)
        cb(null, solid)
    }
    xhr.send(null);
}
