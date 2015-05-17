//     var r = CSG.roundedRectangle({
//       center: [0, 0],
//       radius: [2, 1],
//       roundradius: 0.2,
//       resolution: 8,
//     });
var optionParser = require('../../util/optionParser'),
    config = require('../../config'),
    rectangle = require('./rectangle')

module.exports = function roundedRectangle(options) {
    var G = require('../../geometry/')

	options = options || {};
	var center = optionParser.parseAs2DVector(options, "center", [0, 0]);
	var radius = optionParser.parseAs2DVector(options, "radius", [1, 1]);
	var roundradius = optionParser.parseAsFloat(options, "roundradius", 0.2);
	var resolution = optionParser.parseAsInt(options, "resolution", config.defaultResolution2D);
	var maxroundradius = Math.min(radius.x, radius.y);
	maxroundradius -= 0.1;
	roundradius = Math.min(roundradius, maxroundradius);
	roundradius = Math.max(0, roundradius);
	radius = new G.Vector2D(radius.x - roundradius, radius.y - roundradius);
	var rect = rectangle({
		center: center,
		radius: radius
	});
	if(roundradius > 0) {
		rect = rect.expand(roundradius, resolution);
	}
	return rect;
};
