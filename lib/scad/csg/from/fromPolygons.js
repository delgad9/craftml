var CSG = require('../CSG')

// Construct a CSG solid from a list of `CSG.Polygon` instances.
module.exports = function fromPolygons(polygons) {
	var csg = new CSG();
	csg.polygons = polygons;
	csg.isCanonicalized = false;
	csg.isRetesselated = false;
	return csg;
};
