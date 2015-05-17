/*
fixTJunctions:

Suppose we have two polygons ACDB and EDGF:

A-----B
|     |
|     E--F
|     |  |
C-----D--G

Note that vertex E forms a T-junction on the side BD. In this case some STL slicers will complain
that the solid is not watertight. This is because the watertightness check is done by checking if
each side DE is matched by another side ED.

This function will return a new solid with ACDB replaced by ACDEB

Note that this can create polygons that are slightly non-convex (due to rounding errors). Therefore the result should
not be used for further CSG operations!
*/
var Polygon = require('../geometry/Polygon'),
    fromPolygons = require('../from/fromPolygons')

module.exports = function fixTJunctions() {
    var csg = this.canonicalized();
    var sidemap = {};
    for(var polygonindex = 0; polygonindex < csg.polygons.length; polygonindex++) {
        var polygon = csg.polygons[polygonindex];
        var numvertices = polygon.vertices.length;
        if(numvertices >= 3) // should be true
        {
            var vertex = polygon.vertices[0];
            var vertextag = vertex.getTag();
            for(var vertexindex = 0; vertexindex < numvertices; vertexindex++) {
                var nextvertexindex = vertexindex + 1;
                if(nextvertexindex == numvertices) nextvertexindex = 0;
                var nextvertex = polygon.vertices[nextvertexindex];
                var nextvertextag = nextvertex.getTag();
                var sidetag = vertextag + "/" + nextvertextag;
                var reversesidetag = nextvertextag + "/" + vertextag;
                if(reversesidetag in sidemap) {
                    // this side matches the same side in another polygon. Remove from sidemap:
                    var ar = sidemap[reversesidetag];
                    ar.splice(-1, 1);
                    if(ar.length === 0) {
                        delete sidemap[reversesidetag];
                    }
                } else {
                    var sideobj = {
                        vertex0: vertex,
                        vertex1: nextvertex,
                        polygonindex: polygonindex
                    };
                    if(!(sidetag in sidemap)) {
                        sidemap[sidetag] = [sideobj];
                    } else {
                        sidemap[sidetag].push(sideobj);
                    }
                }
                vertex = nextvertex;
                vertextag = nextvertextag;
            }
        }
    }
    // now sidemap contains 'unmatched' sides
    // i.e. side AB in one polygon does not have a matching side BA in another polygon
    var vertextag2sidestart = {};
    var vertextag2sideend = {};
    var sidestocheck = {};
    var sidemapisempty = true;
    for(var sidetag in sidemap) {
        sidemapisempty = false;
        sidestocheck[sidetag] = true;
        sidemap[sidetag].map(function(sideobj) {
            var starttag = sideobj.vertex0.getTag();
            var endtag = sideobj.vertex1.getTag();
            if(starttag in vertextag2sidestart) {
                vertextag2sidestart[starttag].push(sidetag);
            } else {
                vertextag2sidestart[starttag] = [sidetag];
            }
            if(endtag in vertextag2sideend) {
                vertextag2sideend[endtag].push(sidetag);
            } else {
                vertextag2sideend[endtag] = [sidetag];
            }
        });
    }

    if(!sidemapisempty) {
        // make a copy of the polygons array, since we are going to modify it:
        var polygons = csg.polygons.slice(0);

        function addSide (vertex0, vertex1, polygonindex) {
            var starttag = vertex0.getTag();
            var endtag = vertex1.getTag();
            if(starttag == endtag) throw new Error("Assertion failed");
            var newsidetag = starttag + "/" + endtag;
            var reversesidetag = endtag + "/" + starttag;
            if(reversesidetag in sidemap) {
                // we have a matching reverse oriented side.
                // Instead of adding the new side, cancel out the reverse side:
                // console.log("addSide("+newsidetag+") has reverse side:");
                deleteSide(vertex1, vertex0, null);
                return null;
            }
            //  console.log("addSide("+newsidetag+")");
            var newsideobj = {
                vertex0: vertex0,
                vertex1: vertex1,
                polygonindex: polygonindex
            };
            if(!(newsidetag in sidemap)) {
                sidemap[newsidetag] = [newsideobj];
            } else {
                sidemap[newsidetag].push(newsideobj);
            }
            if(starttag in vertextag2sidestart) {
                vertextag2sidestart[starttag].push(newsidetag);
            } else {
                vertextag2sidestart[starttag] = [newsidetag];
            }
            if(endtag in vertextag2sideend) {
                vertextag2sideend[endtag].push(newsidetag);
            } else {
                vertextag2sideend[endtag] = [newsidetag];
            }
            return newsidetag;
        }

        function deleteSide (vertex0, vertex1, polygonindex) {
            var starttag = vertex0.getTag();
            var endtag = vertex1.getTag();
            var sidetag = starttag + "/" + endtag;
            // console.log("deleteSide("+sidetag+")");
            if(!(sidetag in sidemap)) throw new Error("Assertion failed");
            var idx = -1;
            var sideobjs = sidemap[sidetag];
            for(var i = 0; i < sideobjs.length; i++) {
                var sideobj = sideobjs[i];
                if(sideobj.vertex0 != vertex0) continue;
                if(sideobj.vertex1 != vertex1) continue;
                if(polygonindex !== null) {
                    if(sideobj.polygonindex != polygonindex) continue;
                }
                idx = i;
                break;
            }
            if(idx < 0) throw new Error("Assertion failed");
            sideobjs.splice(idx, 1);
            if(sideobjs.length === 0) {
                delete sidemap[sidetag];
            }
            idx = vertextag2sidestart[starttag].indexOf(sidetag);
            if(idx < 0) throw new Error("Assertion failed");
            vertextag2sidestart[starttag].splice(idx, 1);
            if(vertextag2sidestart[starttag].length === 0) {
                delete vertextag2sidestart[starttag];
            }

            idx = vertextag2sideend[endtag].indexOf(sidetag);
            if(idx < 0) throw new Error("Assertion failed");
            vertextag2sideend[endtag].splice(idx, 1);
            if(vertextag2sideend[endtag].length === 0) {
                delete vertextag2sideend[endtag];
            }
        }


        while(true) {
            var sidemapisempty = true;
            for(var sidetag in sidemap) {
                sidemapisempty = false;
                sidestocheck[sidetag] = true;
            }
            if(sidemapisempty) break;
            var donesomething = false;
            while(true) {
                var sidetagtocheck = null;
                for(var sidetag in sidestocheck) {
                    sidetagtocheck = sidetag;
                    break;
                }
                if(sidetagtocheck === null) break; // sidestocheck is empty, we're done!
                var donewithside = true;
                if(sidetagtocheck in sidemap) {
                    var sideobjs = sidemap[sidetagtocheck];
                    if(sideobjs.length === 0) throw new Error("Assertion failed");
                    var sideobj = sideobjs[0];
                    for(var directionindex = 0; directionindex < 2; directionindex++) {
                        var startvertex = (directionindex === 0) ? sideobj.vertex0 : sideobj.vertex1;
                        var endvertex = (directionindex === 0) ? sideobj.vertex1 : sideobj.vertex0;
                        var startvertextag = startvertex.getTag();
                        var endvertextag = endvertex.getTag();
                        var matchingsides = [];
                        if(directionindex === 0) {
                            if(startvertextag in vertextag2sideend) {
                                matchingsides = vertextag2sideend[startvertextag];
                            }
                        } else {
                            if(startvertextag in vertextag2sidestart) {
                                matchingsides = vertextag2sidestart[startvertextag];
                            }
                        }
                        for(var matchingsideindex = 0; matchingsideindex < matchingsides.length; matchingsideindex++) {
                            var matchingsidetag = matchingsides[matchingsideindex];
                            var matchingside = sidemap[matchingsidetag][0];
                            var matchingsidestartvertex = (directionindex === 0) ? matchingside.vertex0 : matchingside.vertex1;
                            var matchingsideendvertex = (directionindex === 0) ? matchingside.vertex1 : matchingside.vertex0;
                            var matchingsidestartvertextag = matchingsidestartvertex.getTag();
                            var matchingsideendvertextag = matchingsideendvertex.getTag();
                            if(matchingsideendvertextag != startvertextag) throw new Error("Assertion failed");
                            if(matchingsidestartvertextag == endvertextag) {
                                // matchingside cancels sidetagtocheck
                                deleteSide(startvertex, endvertex, null);
                                deleteSide(endvertex, startvertex, null);
                                donewithside = false;
                                directionindex = 2; // skip reverse direction check
                                donesomething = true;
                                break;
                            } else {
                                var startpos = startvertex.pos;
                                var endpos = endvertex.pos;
                                var checkpos = matchingsidestartvertex.pos;
                                var direction = checkpos.minus(startpos);
                                // Now we need to check if endpos is on the line startpos-checkpos:
                                var t = endpos.minus(startpos).dot(direction) / direction.dot(direction);
                                if((t > 0) && (t < 1)) {
                                    var closestpoint = startpos.plus(direction.times(t));
                                    var distancesquared = closestpoint.distanceToSquared(endpos);
                                    if(distancesquared < 1e-10) {
                                        // Yes it's a t-junction! We need to split matchingside in two:
                                        var polygonindex = matchingside.polygonindex;
                                        var polygon = polygons[polygonindex];
                                        // find the index of startvertextag in polygon:
                                        var insertionvertextag = matchingside.vertex1.getTag();
                                        var insertionvertextagindex = -1;
                                        for(var i = 0; i < polygon.vertices.length; i++) {
                                            if(polygon.vertices[i].getTag() == insertionvertextag) {
                                                insertionvertextagindex = i;
                                                break;
                                            }
                                        }
                                        if(insertionvertextagindex < 0) throw new Error("Assertion failed");
                                        // split the side by inserting the vertex:
                                        var newvertices = polygon.vertices.slice(0);
                                        newvertices.splice(insertionvertextagindex, 0, endvertex);
                                        var newpolygon = new Polygon(newvertices, polygon.shared /*polygon.plane*/ );
                                        polygons[polygonindex] = newpolygon;

                                        // remove the original sides from our maps:
                                        // deleteSide(sideobj.vertex0, sideobj.vertex1, null);
                                        deleteSide(matchingside.vertex0, matchingside.vertex1, polygonindex);
                                        var newsidetag1 = addSide(matchingside.vertex0, endvertex, polygonindex);
                                        var newsidetag2 = addSide(endvertex, matchingside.vertex1, polygonindex);
                                        if(newsidetag1 !== null) sidestocheck[newsidetag1] = true;
                                        if(newsidetag2 !== null) sidestocheck[newsidetag2] = true;
                                        donewithside = false;
                                        directionindex = 2; // skip reverse direction check
                                        donesomething = true;
                                        break;
                                    } // if(distancesquared < 1e-10)
                                } // if( (t > 0) && (t < 1) )
                            } // if(endingstidestartvertextag == endvertextag)
                        } // for matchingsideindex
                    } // for directionindex
                } // if(sidetagtocheck in sidemap)
                if(donewithside) {
                    delete sidestocheck[sidetag];
                }
            }
            if(!donesomething) break;
        }
        var newcsg = fromPolygons(polygons);
        newcsg.properties = csg.properties;
        newcsg.isCanonicalized = true;
        newcsg.isRetesselated = true;
        csg = newcsg;
    } // if(!sidemapisempty)
    var sidemapisempty = true;
    for(var sidetag in sidemap) {
        sidemapisempty = false;
        break;
    }
    if(!sidemapisempty) {
        throw new Error("!sidemapisempty");
    }
    return csg;
}
