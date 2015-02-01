'strict'


var $$$ = require('craft-scad')

var Block = require('./block'),
    Solid = require('./solid')

module.exports = TextElement

function TextElement(text) {
    this.contents = []
    this.text = text
    this.type = 'TextElement'
}

TextElement.prototype = new Block()
TextElement.prototype.constructor = TextElement

function renderText(text) {
    var size = 10

    var l = $$$.vector_text(0, 0, text); // l contains a list of polylines to be drawn
    var o = [];
    l.forEach(function(pl) { // pl = polyline (not closed)
        o.push($$$.rectangular_extrude(pl, {
            w: 2,
            h: 2
        })); // extrude it to 3D
    });

    var scaleFactor = 0.25 * (size / 10);
    var depthScaleFactor = 0.1;

    // var r = union(o).scale([scaleFactor,scaleFactor,depthScaleFactor]);	
    // speedup for now
    var r = $$$.group(o).scale([scaleFactor, scaleFactor, depthScaleFactor]);

    return r
}

TextElement.prototype.render = function(scope) {

    var csg = renderText(this.text)

    var solid = new Solid()
    solid.csg = csg
    // TODO: handle error

    solid.layout = computeLayout(csg)
    return solid
}

function computeLayout(csg) {
    var cb = csg.getBounds()
    var layout = {}
    return {
        size: {
            x: cb[1].x - cb[0].x,
            y: cb[1].y - cb[0].y,
            z: cb[1].z - cb[0].z
        },
        x: cb[0].x,
        y: cb[0].y,
        z: cb[0].z,
        width: cb[1].x - cb[0].x,
        height: cb[1].y - cb[0].y,
        depth: cb[1].z - cb[0].z
    }
}