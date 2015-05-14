module.exports = function(CSG){
    //////////////////////////////////////
    // # Class Path2D
    CSG.Path2D = function(points, closed) {
    	closed = !! closed;
    	points = points || [];
    	// re-parse the points into CSG.Vector2D
    	// and remove any duplicate points
    	var prevpoint = null;
    	if(closed && (points.length > 0)) {
    		prevpoint = new CSG.Vector2D(points[points.length - 1]);
    	}
    	var newpoints = [];
    	points.map(function(point) {
    		point = new CSG.Vector2D(point);
    		var skip = false;
    		if(prevpoint !== null) {
    			var distance = point.distanceTo(prevpoint);
    			skip = distance < 1e-5;
    		}
    		if(!skip) newpoints.push(point);
    		prevpoint = point;
    	});
    	this.points = newpoints;
    	this.closed = closed;
    };

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
    CSG.Path2D.arc = function(options) {
    	var center = CSG.parseOptionAs2DVector(options, "center", 0);
    	var radius = CSG.parseOptionAsFloat(options, "radius", 1);
    	var startangle = CSG.parseOptionAsFloat(options, "startangle", 0);
    	var endangle = CSG.parseOptionAsFloat(options, "endangle", 360);
    	var resolution = CSG.parseOptionAsInt(options, "resolution", CSG.defaultResolution2D);
    	var maketangent = CSG.parseOptionAsBool(options, "maketangent", false);
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
    			point = CSG.Vector2D.fromAngle(angle / 180.0 * Math.PI).times(radius);
    			points.push(point.plus(center));
    		}
    	}
    	return new CSG.Path2D(points, false);
    };

    CSG.Path2D.prototype = {
    	concat: function(otherpath) {
    		if(this.closed || otherpath.closed) {
    			throw new Error("Paths must not be closed");
    		}
    		var newpoints = this.points.concat(otherpath.points);
    		return new CSG.Path2D(newpoints);
    	},

    	appendPoint: function(point) {
    		if(this.closed) {
    			throw new Error("Paths must not be closed");
    		}
    		var newpoints = this.points.concat([point]);
    		return new CSG.Path2D(newpoints);
    	},

    	close: function() {
    		return new CSG.Path2D(this.points, true);
    	},

    	// Extrude the path by following it with a rectangle (upright, perpendicular to the path direction)
    	// Returns a CSG solid
    	//   width: width of the extrusion, in the z=0 plane
    	//   height: height of the extrusion in the z direction
    	//   resolution: number of segments per 360 degrees for the curve in a corner
    	rectangularExtrude: function(width, height, resolution) {
    		var cag = this.expandToCAG(width / 2, resolution);
    		var result = cag.extrude({
    			offset: [0, 0, height]
    		});
    		return result;
    	},

    	// Expand the path to a CAG
    	// This traces the path with a circle with radius pathradius
    	expandToCAG: function(pathradius, resolution) {
    		var sides = [];
    		var numpoints = this.points.length;
    		var startindex = 0;
    		if(this.closed && (numpoints > 2)) startindex = -1;
    		var prevvertex;
    		for(var i = startindex; i < numpoints; i++) {
    			var pointindex = i;
    			if(pointindex < 0) pointindex = numpoints - 1;
    			var point = this.points[pointindex];
    			var vertex = new CAG.Vertex(point);
    			if(i > startindex) {
    				var side = new CAG.Side(prevvertex, vertex);
    				sides.push(side);
    			}
    			prevvertex = vertex;
    		}
    		var shellcag = CAG.fromSides(sides);
    		var expanded = shellcag.expandedShell(pathradius, resolution);
    		return expanded;
    	},

    	innerToCAG: function() {
    		if(!this.closed) throw new Error("The path should be closed!");
    		return CAG.fromPoints(this.points);
    	},

    	transform: function(matrix4x4) {
    		var newpoints = this.points.map(function(point) {
    			return point.multiply4x4(matrix4x4);
    		});
    		return new CSG.Path2D(newpoints, this.closed);
    	}
    };

}
