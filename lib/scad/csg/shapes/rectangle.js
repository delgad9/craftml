/* Construct a rectangle
   options:
	 center: a 2D center point
	 radius: a 2D vector with width and height
   returns a CAG object
*/
var CAG = require('../../cag'),
    optionParser = require('../util/optionParser'),
    G = require('../../geometry')

module.exports = function rectangle(options) {
	options = options || {};
	var c = optionParser.parseAs2DVector(options, "center", [0, 0]);
	var r = optionParser.parseAs2DVector(options, "radius", [1, 1]);
	var rswap = new G.Vector2D(r.x, -r.y);
	var points = [c.plus(r), c.plus(rswap), c.minus(r), c.minus(rswap)];
	return CAG.fromPoints(points);
}
