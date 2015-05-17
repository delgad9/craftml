/*
Construct a (part of a) circle. Parameters:
  options.center: the center point of the arc (CSG.Vector2D or array [x,y])
  options.radius: the circle radius (float)
  options.startangle: the starting angle of the arc, in degrees
	0 degrees corresponds to [1,0]
	90 degrees to [0,1]
	and so on
  options.endangle: the ending angle of the arc, in degrees
  options.resolution: number of points per 360 degree of rotation
  options.maketangent: adds two extra tiny line segments at both ends of the circle
	this ensures that the gradients at the edges are tangent to the circle
Returns a CSG.Path2D. The path is not closed (even if it is a 360 degree arc).
close() the resultin path if you want to create a true circle.
*/
var optionParser = require('../util/optionParser'),
    config = require('./config'),
    Path2D = require('../geometry/Path2D')

module.exports = function arc(options) {
	var center = optionParser.parseAs2DVector(options, "center", 0);
	var radius = optionParser.parseAsFloat(options, "radius", 1);
	var startangle = optionParser.parseAsFloat(options, "startangle", 0);
	var endangle = optionParser.parseAsFloat(options, "endangle", 360);
	var resolution = optionParser.parseAsInt(options, "resolution", config.defaultResolution2D);
	var maketangent = optionParser.parseAsBool(options, "maketangent", false);
	// no need to make multiple turns:
	while(endangle - startangle >= 720) {
		endangle -= 360;
	}
	while(endangle - startangle <= -720) {
		endangle += 360;
	}
	var points = [], point;
	var absangledif = Math.abs(endangle - startangle);
	if(absangledif < 1e-5) {
		point = CSG.Vector2D.fromAngle(startangle / 180.0 * Math.PI).times(radius);
		points.push(point.plus(center));
	} else {
		var numsteps = Math.floor(resolution * absangledif / 360) + 1;
		var edgestepsize = numsteps * 0.5 / absangledif; // step size for half a degree
		if(edgestepsize > 0.25) edgestepsize = 0.25;
		var numsteps_mod = maketangent ? (numsteps + 2) : numsteps;
		for(var i = 0; i <= numsteps_mod; i++) {
			var step = i;
			if(maketangent) {
				step = (i - 1) * (numsteps - 2 * edgestepsize) / numsteps + edgestepsize;
				if(step < 0) step = 0;
				if(step > numsteps) step = numsteps;
			}
			var angle = startangle + step * (endangle - startangle) / numsteps;
			point = Vector2D.fromAngle(angle / 180.0 * Math.PI).times(radius);
			points.push(point.plus(center));
		}
	}
	return new Path2D(points, false);
};
