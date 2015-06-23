module.exports = function toStlString() {
    var result = "solid craftml\n";
    this.polygons.map(function(p) {
        result += p.toStlString();
    });
    result += "endsolid craftml\n";
    return result;
}
