/* Construct a circle
   options:
	 center: a 2D center point
	 radius: a scalar
	 resolution: number of sides per 360 degree rotation
   returns a CAG object
*/
var CAG = require('../../cag'),
    CSG = require('../../csg'),
    optionParser = require('../../util/optionParser'),
    config = require('../../config')


module.exports = function circle(options) {
    var G = require('../../geometry')

	options = options || {};
	var center = optionParser.parseAs2DVector(options, "center", [0, 0]);
	var radius = optionParser.parseAsFloat(options, "radius", 1);
	var resolution = optionParser.parseAsInt(options, "resolution", config.defaultResolution2D);
	var sides = [];
	var prevvertex;
	for(var i = 0; i <= resolution; i++) {
		var radians = 2 * Math.PI * i / resolution;
		var point = G.Vector2D.fromAngleRadians(radians).times(radius).plus(center);
		var vertex = new CAG.Vertex(point);
		if(i > 0) {
			sides.push(new CAG.Side(prevvertex, vertex));
		}
		prevvertex = vertex;
	}
	return CAG.fromSides(sides);
};
