module.exports = function toStlString() {
    var result = "solid csg.js\n";
    this.polygons.map(function(p) {
        result += p.toStlString();
    });
    result += "endsolid csg.js\n";
    return result;
}
