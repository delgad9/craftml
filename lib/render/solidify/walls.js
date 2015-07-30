import G from '../../scad/geometry'
import CAG from '../../scad/cag'
import CSG from '../../scad/csg'

var walls = {
    buildBetweenPolygons: build_walls_between_polygons
}

export default walls

export function build_walls_between_polygons(top, bottom, needsFlipping){

    var bottomPoints = bottom.vertices.slice(0), //make a copy
        topPoints = top.vertices.slice(0), //make a copy
        color = top.shared || null;

    var iTopLen = topPoints.length - 1,
        iBotLen = bottomPoints.length - 1

    let flipped = bottom.plane.signedDistanceToPoint(top.vertices[0].pos) < 0
    if (flipped){
        // bottomPoints = bottomPoints.reverse()
        // topPoints = topPoints.reverse()
    }

    var getTriangle = function addWallsPutTriangle(pointA, pointB, pointC, color) {
        if (needsFlipping){
            return new G.Polygon([pointB, pointA, pointC], color);
        } else {
            return new G.Polygon([pointA, pointB, pointC], color);
        }
    };

    var bpoint = bottomPoints[0],
        tpoint = topPoints[0],
        secondPoint

    //console.log(top.vertices.length, topPoints.length)
    //console.log(bottom.vertices.length, bottomPoints.length)

    var alt = true
    var walls = []
    for (var iB = 0, iT = 0, iMax = iTopLen + iBotLen; iB + iT < iMax;) {

        let wall

        if (alt){

            secondPoint = bottomPoints[++iB];
            wall = getTriangle(
                tpoint, bpoint, secondPoint, color
            )
            bpoint = secondPoint;

        } else {

            secondPoint = topPoints[++iT];
            wall = getTriangle(
                secondPoint, tpoint, bpoint, color
            )
            tpoint = secondPoint;
        }

        // if the wall has a valid plane is valid (i.e., the surface normal is a not NaN)
        if (!isNaN(wall.plane.w)){
            // add this wall
            walls.push(wall)
        } else {
            // the wall does not have a valid plane if two or more of the vertices coincide
            // ignore this wall
        }

        alt = !alt
    }
    return walls;
}
