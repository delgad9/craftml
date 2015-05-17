var G = require('../../geometry')
    OrthoNormalBasis = G.OrthoNormalBasis,
    Vector2D = G.Vector2D,
    Polygon = G.Polygon,
    Vertex = G.Vertex,
    Line2D = G.Line2D

function fnNumberSort(a, b) {
	return a - b;
}

function insertSorted(array, element, comparefunc) {
	var leftbound = 0;
	var rightbound = array.length;
	while(rightbound > leftbound) {
		var testindex = Math.floor((leftbound + rightbound) / 2);
		var testelement = array[testindex];
		var compareresult = comparefunc(element, testelement);
		if(compareresult > 0) // element > testelement
		{
			leftbound = testindex + 1;
		} else {
			rightbound = testindex;
		}
	}
	array.splice(leftbound, 0, element);
}

function interpolateBetween2DPointsForY(point1, point2, y) {
	var f1 = y - point1.y;
	var f2 = point2.y - point1.y;
	if(f2 < 0) {
		f1 = -f1;
		f2 = -f2;
	}
	var t;
	if(f1 <= 0) {
		t = 0.0;
	} else if(f1 >= f2) {
		t = 1.0;
	} else if(f2 < 1e-10) {
		t = 0.5;
	} else {
		t = f1 / f2;
	}
	var result = point1.x + t * (point2.x - point1.x);
	return result;
}

module.exports = function reTesselateCoplanarPolygons(sourcepolygons, destpolygons) {
	var EPS = 1e-5;

	var numpolygons = sourcepolygons.length;
	if(numpolygons > 0) {
		var plane = sourcepolygons[0].plane;
		var shared = sourcepolygons[0].shared;
		var orthobasis = new OrthoNormalBasis(plane);
		var polygonvertices2d = []; // array of array of CSG.Vector2D
		var polygontopvertexindexes = []; // array of indexes of topmost vertex per polygon
		var topy2polygonindexes = {};
		var ycoordinatetopolygonindexes = {};

		var xcoordinatebins = {};
		var ycoordinatebins = {};

		// convert all polygon vertices to 2D
		// Make a list of all encountered y coordinates
		// And build a map of all polygons that have a vertex at a certain y coordinate:
		var ycoordinateBinningFactor = 1.0 / EPS * 10;
		for(var polygonindex = 0; polygonindex < numpolygons; polygonindex++) {
			var poly3d = sourcepolygons[polygonindex];
			var vertices2d = [];
			var numvertices = poly3d.vertices.length;
			var minindex = -1;
			if(numvertices > 0) {
				var miny, maxy, maxindex;
				for(var i = 0; i < numvertices; i++) {
					var pos2d = orthobasis.to2D(poly3d.vertices[i].pos);
					// perform binning of y coordinates: If we have multiple vertices very
					// close to each other, give them the same y coordinate:
					var ycoordinatebin = Math.floor(pos2d.y * ycoordinateBinningFactor);
					var newy;
					if(ycoordinatebin in ycoordinatebins) {
						newy = ycoordinatebins[ycoordinatebin];
					} else if(ycoordinatebin + 1 in ycoordinatebins) {
						newy = ycoordinatebins[ycoordinatebin + 1];
					} else if(ycoordinatebin - 1 in ycoordinatebins) {
						newy = ycoordinatebins[ycoordinatebin - 1];
					} else {
						newy = pos2d.y;
						ycoordinatebins[ycoordinatebin] = pos2d.y;
					}
					pos2d = new Vector2D(pos2d.x, newy);
					vertices2d.push(pos2d);
					var y = pos2d.y;
					if((i === 0) || (y < miny)) {
						miny = y;
						minindex = i;
					}
					if((i === 0) || (y > maxy)) {
						maxy = y;
						maxindex = i;
					}
					if(!(y in ycoordinatetopolygonindexes)) {
						ycoordinatetopolygonindexes[y] = {};
					}
					ycoordinatetopolygonindexes[y][polygonindex] = true;
				}
				if(miny >= maxy) {
					// degenerate polygon, all vertices have same y coordinate. Just ignore it from now:
					vertices2d = [];
				} else {
					if(!(miny in topy2polygonindexes)) {
						topy2polygonindexes[miny] = [];
					}
					topy2polygonindexes[miny].push(polygonindex);
				}
			} // if(numvertices > 0)
			// reverse the vertex order:
			vertices2d.reverse();
			minindex = numvertices - minindex - 1;
			polygonvertices2d.push(vertices2d);
			polygontopvertexindexes.push(minindex);
		}
		var ycoordinates = [];
		for(var ycoordinate in ycoordinatetopolygonindexes) ycoordinates.push(ycoordinate);
		ycoordinates.sort(fnNumberSort);

		// Now we will iterate over all y coordinates, from lowest to highest y coordinate
		// activepolygons: source polygons that are 'active', i.e. intersect with our y coordinate
		//   Is sorted so the polygons are in left to right order
		// Each element in activepolygons has these properties:
		//        polygonindex: the index of the source polygon (i.e. an index into the sourcepolygons
		//                      and polygonvertices2d arrays)
		//        leftvertexindex: the index of the vertex at the left side of the polygon (lowest x)
		//                         that is at or just above the current y coordinate
		//        rightvertexindex: dito at right hand side of polygon
		//        topleft, bottomleft: coordinates of the left side of the polygon crossing the current y coordinate
		//        topright, bottomright: coordinates of the right hand side of the polygon crossing the current y coordinate
		var activepolygons = [];
		var prevoutpolygonrow = [];
		for(var yindex = 0; yindex < ycoordinates.length; yindex++) {
			var newoutpolygonrow = [];
			var ycoordinate_as_string = ycoordinates[yindex];
			var ycoordinate = Number(ycoordinate_as_string);

			// update activepolygons for this y coordinate:
			// - Remove any polygons that end at this y coordinate
			// - update leftvertexindex and rightvertexindex (which point to the current vertex index
			//   at the the left and right side of the polygon
			// Iterate over all polygons that have a corner at this y coordinate:
			var polygonindexeswithcorner = ycoordinatetopolygonindexes[ycoordinate_as_string];
			for(var activepolygonindex = 0; activepolygonindex < activepolygons.length; ++activepolygonindex) {
				var activepolygon = activepolygons[activepolygonindex];
				var polygonindex = activepolygon.polygonindex;
				if(polygonindexeswithcorner[polygonindex]) {
					// this active polygon has a corner at this y coordinate:
					var vertices2d = polygonvertices2d[polygonindex];
					var numvertices = vertices2d.length;
					var newleftvertexindex = activepolygon.leftvertexindex;
					var newrightvertexindex = activepolygon.rightvertexindex;
					// See if we need to increase leftvertexindex or decrease rightvertexindex:
					while(true) {
						var nextleftvertexindex = newleftvertexindex + 1;
						if(nextleftvertexindex >= numvertices) nextleftvertexindex = 0;
						if(vertices2d[nextleftvertexindex].y != ycoordinate) break;
						newleftvertexindex = nextleftvertexindex;
					}
					var nextrightvertexindex = newrightvertexindex - 1;
					if(nextrightvertexindex < 0) nextrightvertexindex = numvertices - 1;
					if(vertices2d[nextrightvertexindex].y == ycoordinate) {
						newrightvertexindex = nextrightvertexindex;
					}
					if((newleftvertexindex != activepolygon.leftvertexindex) && (newleftvertexindex == newrightvertexindex)) {
						// We have increased leftvertexindex or decreased rightvertexindex, and now they point to the same vertex
						// This means that this is the bottom point of the polygon. We'll remove it:
						activepolygons.splice(activepolygonindex, 1);
						--activepolygonindex;
					} else {
						activepolygon.leftvertexindex = newleftvertexindex;
						activepolygon.rightvertexindex = newrightvertexindex;
						activepolygon.topleft = vertices2d[newleftvertexindex];
						activepolygon.topright = vertices2d[newrightvertexindex];
						var nextleftvertexindex = newleftvertexindex + 1;
						if(nextleftvertexindex >= numvertices) nextleftvertexindex = 0;
						activepolygon.bottomleft = vertices2d[nextleftvertexindex];
						var nextrightvertexindex = newrightvertexindex - 1;
						if(nextrightvertexindex < 0) nextrightvertexindex = numvertices - 1;
						activepolygon.bottomright = vertices2d[nextrightvertexindex];
					}
				} // if polygon has corner here
			} // for activepolygonindex
			var nextycoordinate;
			if(yindex >= ycoordinates.length - 1) {
				// last row, all polygons must be finished here:
				activepolygons = [];
				nextycoordinate = null;
			} else // yindex < ycoordinates.length-1
			{
				nextycoordinate = Number(ycoordinates[yindex + 1]);
				var middleycoordinate = 0.5 * (ycoordinate + nextycoordinate);
				// update activepolygons by adding any polygons that start here:
				var startingpolygonindexes = topy2polygonindexes[ycoordinate_as_string];
				for(var polygonindex_key in startingpolygonindexes) {
					var polygonindex = startingpolygonindexes[polygonindex_key];
					var vertices2d = polygonvertices2d[polygonindex];
					var numvertices = vertices2d.length;
					var topvertexindex = polygontopvertexindexes[polygonindex];
					// the top of the polygon may be a horizontal line. In that case topvertexindex can point to any point on this line.
					// Find the left and right topmost vertices which have the current y coordinate:
					var topleftvertexindex = topvertexindex;
					while(true) {
						var i = topleftvertexindex + 1;
						if(i >= numvertices) i = 0;
						if(vertices2d[i].y != ycoordinate) break;
						if(i == topvertexindex) break; // should not happen, but just to prevent endless loops
						topleftvertexindex = i;
					}
					var toprightvertexindex = topvertexindex;
					while(true) {
						var i = toprightvertexindex - 1;
						if(i < 0) i = numvertices - 1;
						if(vertices2d[i].y != ycoordinate) break;
						if(i == topleftvertexindex) break; // should not happen, but just to prevent endless loops
						toprightvertexindex = i;
					}
					var nextleftvertexindex = topleftvertexindex + 1;
					if(nextleftvertexindex >= numvertices) nextleftvertexindex = 0;
					var nextrightvertexindex = toprightvertexindex - 1;
					if(nextrightvertexindex < 0) nextrightvertexindex = numvertices - 1;
					var newactivepolygon = {
						polygonindex: polygonindex,
						leftvertexindex: topleftvertexindex,
						rightvertexindex: toprightvertexindex,
						topleft: vertices2d[topleftvertexindex],
						topright: vertices2d[toprightvertexindex],
						bottomleft: vertices2d[nextleftvertexindex],
						bottomright: vertices2d[nextrightvertexindex],
					};
					insertSorted(activepolygons, newactivepolygon, function(el1, el2) {
						var x1 = interpolateBetween2DPointsForY(
									el1.topleft, el1.bottomleft, middleycoordinate);
						var x2 = interpolateBetween2DPointsForY(
									el2.topleft, el2.bottomleft, middleycoordinate);
						if(x1 > x2) return 1;
						if(x1 < x2) return -1;
						return 0;
					});
				} // for(var polygonindex in startingpolygonindexes)
			} //  yindex < ycoordinates.length-1
			//if( (yindex == ycoordinates.length-1) || (nextycoordinate - ycoordinate > EPS) )
			if(true) {
				// Now activepolygons is up to date
				// Build the output polygons for the next row in newoutpolygonrow:
				for(var activepolygon_key in activepolygons) {
					var activepolygon = activepolygons[activepolygon_key];
					var polygonindex = activepolygon.polygonindex;
					var vertices2d = polygonvertices2d[polygonindex];
					var numvertices = vertices2d.length;

					var x = interpolateBetween2DPointsForY(activepolygon.topleft, activepolygon.bottomleft, ycoordinate);
					var topleft = new Vector2D(x, ycoordinate);
					x = interpolateBetween2DPointsForY(activepolygon.topright, activepolygon.bottomright, ycoordinate);
					var topright = new Vector2D(x, ycoordinate);
					x = interpolateBetween2DPointsForY(activepolygon.topleft, activepolygon.bottomleft, nextycoordinate);
					var bottomleft = new Vector2D(x, nextycoordinate);
					x = interpolateBetween2DPointsForY(activepolygon.topright, activepolygon.bottomright, nextycoordinate);
					var bottomright = new Vector2D(x, nextycoordinate);
					var outpolygon = {
						topleft: topleft,
						topright: topright,
						bottomleft: bottomleft,
						bottomright: bottomright,
						leftline: Line2D.fromPoints(topleft, bottomleft),
						rightline: Line2D.fromPoints(bottomright, topright)
					};
					if(newoutpolygonrow.length > 0) {
						var prevoutpolygon = newoutpolygonrow[newoutpolygonrow.length - 1];
						var d1 = outpolygon.topleft.distanceTo(prevoutpolygon.topright);
						var d2 = outpolygon.bottomleft.distanceTo(prevoutpolygon.bottomright);
						if((d1 < EPS) && (d2 < EPS)) {
							// we can join this polygon with the one to the left:
							outpolygon.topleft = prevoutpolygon.topleft;
							outpolygon.leftline = prevoutpolygon.leftline;
							outpolygon.bottomleft = prevoutpolygon.bottomleft;
							newoutpolygonrow.splice(newoutpolygonrow.length - 1, 1);
						}
					}
					newoutpolygonrow.push(outpolygon);
				} // for(activepolygon in activepolygons)
				if(yindex > 0) {
					// try to match the new polygons against the previous row:
					var prevcontinuedindexes = {};
					var matchedindexes = {};
					for(var i = 0; i < newoutpolygonrow.length; i++) {
						var thispolygon = newoutpolygonrow[i];
						for(var ii = 0; ii < prevoutpolygonrow.length; ii++) {
							if(!matchedindexes[ii]) // not already processed?
							{
								// We have a match if the sidelines are equal or if the top coordinates
								// are on the sidelines of the previous polygon
								var prevpolygon = prevoutpolygonrow[ii];
								if(prevpolygon.bottomleft.distanceTo(thispolygon.topleft) < EPS) {
									if(prevpolygon.bottomright.distanceTo(thispolygon.topright) < EPS) {
										// Yes, the top of this polygon matches the bottom of the previous:
										matchedindexes[ii] = true;
										// Now check if the joined polygon would remain convex:
										var d1 = thispolygon.leftline.direction().x - prevpolygon.leftline.direction().x;
										var d2 = thispolygon.rightline.direction().x - prevpolygon.rightline.direction().x;
										var leftlinecontinues = Math.abs(d1) < EPS;
										var rightlinecontinues = Math.abs(d2) < EPS;
										var leftlineisconvex = leftlinecontinues || (d1 >= 0);
										var rightlineisconvex = rightlinecontinues || (d2 >= 0);
										if(leftlineisconvex && rightlineisconvex) {
											// yes, both sides have convex corners:
											// This polygon will continue the previous polygon
											thispolygon.outpolygon = prevpolygon.outpolygon;
											thispolygon.leftlinecontinues = leftlinecontinues;
											thispolygon.rightlinecontinues = rightlinecontinues;
											prevcontinuedindexes[ii] = true;
										}
										break;
									}
								}
							} // if(!prevcontinuedindexes[ii])
						} // for ii
					} // for i
					for(var ii = 0; ii < prevoutpolygonrow.length; ii++) {
						if(!prevcontinuedindexes[ii]) {
							// polygon ends here
							// Finish the polygon with the last point(s):
							var prevpolygon = prevoutpolygonrow[ii];
							prevpolygon.outpolygon.rightpoints.push(prevpolygon.bottomright);
							if(prevpolygon.bottomright.distanceTo(prevpolygon.bottomleft) > EPS) {
								// polygon ends with a horizontal line:
								prevpolygon.outpolygon.leftpoints.push(prevpolygon.bottomleft);
							}
							// reverse the left half so we get a counterclockwise circle:
							prevpolygon.outpolygon.leftpoints.reverse();
							var points2d = prevpolygon.outpolygon.rightpoints.concat(prevpolygon.outpolygon.leftpoints);
							var vertices3d = [];
							points2d.map(function(point2d) {
								var point3d = orthobasis.to3D(point2d);
								var vertex3d = new Vertex(point3d);
								vertices3d.push(vertex3d);
							});
							var polygon = new Polygon(vertices3d, shared, plane);
							destpolygons.push(polygon);
						}
					}
				} // if(yindex > 0)
				for(var i = 0; i < newoutpolygonrow.length; i++) {
					var thispolygon = newoutpolygonrow[i];
					if(!thispolygon.outpolygon) {
						// polygon starts here:
						thispolygon.outpolygon = {
							leftpoints: [],
							rightpoints: []
						};
						thispolygon.outpolygon.leftpoints.push(thispolygon.topleft);
						if(thispolygon.topleft.distanceTo(thispolygon.topright) > EPS) {
							// we have a horizontal line at the top:
							thispolygon.outpolygon.rightpoints.push(thispolygon.topright);
						}
					} else {
						// continuation of a previous row
						if(!thispolygon.leftlinecontinues) {
							thispolygon.outpolygon.leftpoints.push(thispolygon.topleft);
						}
						if(!thispolygon.rightlinecontinues) {
							thispolygon.outpolygon.rightpoints.push(thispolygon.topright);
						}
					}
				}
				prevoutpolygonrow = newoutpolygonrow;
			}
		} // for yindex
	} // if(numpolygons > 0)
};
