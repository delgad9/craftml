// # class OrthoNormalBasis
// Reprojects points on a 3D plane onto a 2D plane
// or from a 2D plane back onto the 3D plane

var Vector3D = require('./Vector3D'),
    Vector2D = require('./Vector2D'),
    Plane = require('./Plane'),
    Matrix4x4 = require('../Matrix4x4')

OrthoNormalBasis = function(plane, rightvector) {
	if(arguments.length < 2) {
		// choose an arbitrary right hand vector, making sure it is somewhat orthogonal to the plane normal:
		rightvector = plane.normal.randomNonParallelVector();
	} else {
		rightvector = new Vector3D(rightvector);
	}
	this.v = plane.normal.cross(rightvector).unit();
	this.u = this.v.cross(plane.normal);
	this.plane = plane;
	this.planeorigin = plane.normal.times(plane.w);
};

// The z=0 plane, with the 3D x and y vectors mapped to the 2D x and y vector
OrthoNormalBasis.Z0Plane = function() {
	var plane = new Plane(new Vector3D([0, 0, 1]), 0);
	return new OrthoNormalBasis(plane, new Vector3D([1, 0, 0]));
}

OrthoNormalBasis.prototype = {
	getProjectionMatrix: function() {
		return new Matrix4x4([
			this.u.x, this.v.x, this.plane.normal.x, 0,
			this.u.y, this.v.y, this.plane.normal.y, 0,
			this.u.z, this.v.z, this.plane.normal.z, 0,
			0, 0, -this.plane.w, 1]);
	},

	getInverseProjectionMatrix: function() {
		var p = this.plane.normal.times(this.plane.w);
		return new Matrix4x4([
			this.u.x, this.u.y, this.u.z, 0,
			this.v.x, this.v.y, this.v.z, 0,
			this.plane.normal.x, this.plane.normal.y, this.plane.normal.z, 0,
			p.x, p.y, p.z, 1]);
	},

	to2D: function(vec3) {
		return new Vector2D(vec3.dot(this.u), vec3.dot(this.v));
	},

	to3D: function(vec2) {
		return this.planeorigin.plus(this.u.times(vec2.x)).plus(this.v.times(vec2.y));
	},

	line3Dto2D: function(line3d) {
		var a = line3d.point;
		var b = line3d.direction.plus(a);
		var a2d = this.to2D(a);
		var b2d = this.to2D(b);
		return CSG.Line2D.fromPoints(a2d, b2d);
	},

	line2Dto3D: function(line2d) {
		var a = line2d.origin();
		var b = line2d.direction().plus(a);
		var a3d = this.to3D(a);
		var b3d = this.to3D(b);
		return CSG.Line3D.fromPoints(a3d, b3d);
	},

	transform: function(matrix4x4) {
		// todo: this may not work properly in case of mirroring
		var newplane = this.plane.transform(matrix4x4);
		var rightpoint_transformed = this.u.transform(matrix4x4);
		var origin_transformed = new Vector3D(0, 0, 0).transform(matrix4x4);
		var newrighthandvector = rightpoint_transformed.minus(origin_transformed);
		var newbasis = new OrthoNormalBasis(newplane, newrighthandvector);
		return newbasis;
	}
};

module.exports = OrthoNormalBasis
