var ProtoBuf = dcodeIO.ProtoBuf;
var builder = ProtoBuf.loadJson(proto)
var SolidProto = builder.build("Craftml").Solid

function load(url, cb){

    var xhr = ProtoBuf.Util.XHR();
    xhr.open(
        /* method */ "GET",
        /* file */ "examples/" + o + ".xml.bin",
        /* async */ true
    );
    xhr.responseType = "arraybuffer";
    xhr.onload = function(evt) {
        console.log(xhr.response)
        var solid = SolidProto.decode(xhr.response);
        cb(null, solid)
    }
    xhr.send(null);
}
