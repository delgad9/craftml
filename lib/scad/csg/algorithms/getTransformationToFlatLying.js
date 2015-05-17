var Connector = require('../Connector'),
    G = require('../../geometry')

// Get the transformation that transforms this CSG such that it is lying on the z=0 plane,
// as flat as possible (i.e. the least z-height).
// So that it is in an orientation suitable for CNC milling
module.exports = function getTransformationToFlatLying(csgIn) {

    if(csgIn.polygons.length === 0) {
        return new G.Matrix4x4(); // unity
    } else {
        // get a list of unique planes in the CSG:
        var csg = csgIn.canonicalized();
        var planemap = {};
        csg.polygons.map(function(polygon) {
            planemap[polygon.plane.getTag()] = polygon.plane;
        });
        // try each plane in the CSG and find the plane that, when we align it flat onto z=0,
        // gives the least height in z-direction.
        // If two planes give the same height, pick the plane that originally had a normal closest
        // to [0,0,-1].
        var xvector = new G.Vector3D(1, 0, 0);
        var yvector = new G.Vector3D(0, 1, 0);
        var zvector = new G.Vector3D(0, 0, 1);
        var z0connectorx = new Connector([0, 0, 0], [0, 0, -1], xvector);
        var z0connectory = new Connector([0, 0, 0], [0, 0, -1], yvector);
        var isfirst = true;
        var minheight = 0;
        var maxdotz = 0;
        var besttransformation;
        for(var planetag in planemap) {
            var plane = planemap[planetag];
            var pointonplane = plane.normal.times(plane.w);
            var transformation;
            // We need a normal vecrtor for the transformation
            // determine which is more perpendicular to the plane normal: x or y?
            // we will align this as much as possible to the x or y axis vector
            var xorthogonality = plane.normal.cross(xvector).length();
            var yorthogonality = plane.normal.cross(yvector).length();
            if(xorthogonality > yorthogonality) {
                // x is better:
                var planeconnector = new Connector(pointonplane, plane.normal, xvector);
                transformation = planeconnector.getTransformationTo(z0connectorx, false, 0);
            } else {
                // y is better:
                var planeconnector = new Connector(pointonplane, plane.normal, yvector);
                transformation = planeconnector.getTransformationTo(z0connectory, false, 0);
            }
            var transformedcsg = csg.transform(transformation);
            var dotz = -plane.normal.dot(zvector);
            var bounds = transformedcsg.getBounds();
            var zheight = bounds[1].z - bounds[0].z;
            var isbetter = isfirst;
            if(!isbetter) {
                if(zheight < minheight) {
                    isbetter = true;
                } else if(zheight == minheight) {
                    if(dotz > maxdotz) isbetter = true;
                }
            }
            if(isbetter) {
                // translate the transformation around the z-axis and onto the z plane:
                var translation = [
                    -0.5 * (bounds[1].x + bounds[0].x),
                    -0.5 * (bounds[1].y + bounds[0].y),
                    -bounds[0].z];
                transformation = transformation.multiply(G.Matrix4x4.translation(translation));
                minheight = zheight;
                maxdotz = dotz;
                besttransformation = transformation;
            }
            isfirst = false;
        }
        return besttransformation;
    }
}
