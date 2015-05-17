module.exports = function toAMFString(m) {
    var result = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<amf" + (m && m.unit ? " unit=\"+m.unit\"" : "") + ">\n";
    for (var k in m) {
        result += "<metadata type=\"" + k + "\">" + m[k] + "</metadata>\n";
    }
    result += "<object id=\"0\">\n<mesh>\n<vertices>\n";

    this.polygons.map(function(p) { // first we dump all vertices of all polygons
        for (var i = 0; i < p.vertices.length; i++) {
            result += p.vertices[i].toAMFString();
        }
    });
    result += "</vertices>\n";

    var n = 0;
    this.polygons.map(function(p) { // then we dump all polygons
        result += "<volume>\n";
        if (p.vertices.length < 3)
            return;
        var r = 1,
            g = 0.4,
            b = 1,
            a = 1,
            colorSet = false;
        if (p.shared && p.shared.color) {
            r = p.shared.color[0];
            g = p.shared.color[1];
            b = p.shared.color[2];
            a = p.shared.color[3];
            colorSet = true;
        } else if (p.color) {
            r = p.color[0];
            g = p.color[1];
            b = p.color[2];
            if (p.color.length() > 3) a = p.color[3];
            colorSet = true;
        }

        result += "<color><r>" + r + "</r><g>" + g + "</g><b>" + b + "</b>" + (a !== undefined ? "<a>" + a + "</a>" : "") + "</color>";

        for (var i = 0; i < p.vertices.length - 2; i++) { // making sure they are all triangles (triangular polygons)
            result += "<triangle>";
            result += "<v1>" + (n) + "</v1>";
            result += "<v2>" + (n + i + 1) + "</v2>";
            result += "<v3>" + (n + i + 2) + "</v3>";
            result += "</triangle>\n";
        }
        n += p.vertices.length;
        result += "</volume>\n";
    });
    result += "</mesh>\n</object>\n";
    result += "</amf>\n";
    return result;
}
