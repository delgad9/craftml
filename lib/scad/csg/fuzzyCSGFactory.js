module.exports = function(CSG){
    //////////////////////////////////////
    CSG.fuzzyCSGFactory = function() {
    	this.vertexfactory = new CSG.fuzzyFactory(3, 1e-5);
    	this.planefactory = new CSG.fuzzyFactory(4, 1e-5);
    	this.polygonsharedfactory = {};
    };

    CSG.fuzzyCSGFactory.prototype = {
    	getPolygonShared: function(sourceshared) {
    		var hash = sourceshared.getHash();
    		if(hash in this.polygonsharedfactory) {
    			return this.polygonsharedfactory[hash];
    		} else {
    			this.polygonsharedfactory[hash] = sourceshared;
    			return sourceshared;
    		}
    	},

    	getVertex: function(sourcevertex) {
    		var elements = [sourcevertex.pos._x, sourcevertex.pos._y, sourcevertex.pos._z];
    		var result = this.vertexfactory.lookupOrCreate(elements, function(els) {
    			return sourcevertex;
    		});
    		return result;
    	},

    	getPlane: function(sourceplane) {
    		var elements = [sourceplane.normal._x, sourceplane.normal._y, sourceplane.normal._z, sourceplane.w];
    		var result = this.planefactory.lookupOrCreate(elements, function(els) {
    			return sourceplane;
    		});
    		return result;
    	},

    	getPolygon: function(sourcepolygon) {
    		var newplane = this.getPlane(sourcepolygon.plane);
    		var newshared = this.getPolygonShared(sourcepolygon.shared);
    		var _this = this;
    		var newvertices = sourcepolygon.vertices.map(function(vertex) {
    			return _this.getVertex(vertex);
    		});
    		return new CSG.Polygon(newvertices, newshared, newplane);
    	},

    	getCSG: function(sourcecsg) {
    		var _this = this;
    		var newpolygons = sourcecsg.polygons.map(function(polygon) {
    			return _this.getPolygon(polygon);
    		});
    		return CSG.fromPolygons(newpolygons);
    	}
    };

}
