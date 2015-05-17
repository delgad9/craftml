
var Vector2D = require('./Vector2D'),
    CAG = require('../../cag')

//////////////////////////////////////
// # Class Path2D
function Path2D(points, closed) {
	closed = !! closed;
	points = points || [];
	// re-parse the points into CSG.Vector2D
	// and remove any duplicate points
	var prevpoint = null;
	if(closed && (points.length > 0)) {
		prevpoint = new Vector2D(points[points.length - 1]);
	}
	var newpoints = [];
	points.map(function(point) {
		point = new Vector2D(point);
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

Path2D.prototype = {
	concat: function(otherpath) {
		if(this.closed || otherpath.closed) {
			throw new Error("Paths must not be closed");
		}
		var newpoints = this.points.concat(otherpath.points);
		return new Path2D(newpoints);
	},

	appendPoint: function(point) {
		if(this.closed) {
			throw new Error("Paths must not be closed");
		}
		var newpoints = this.points.concat([point]);
		return new Path2D(newpoints);
	},

	close: function() {
		return new Path2D(this.points, true);
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
		return new Path2D(newpoints, this.closed);
	}
}

module.exports = Path2D
