// # class Tree
// This is the root of a BSP tree
// We are using this separate class for the root of the tree, to hold the PolygonTreeNode root
// The actual tree is kept in this.rootnode

var Node = require('./Node'),
    PolygonTreeNode = require('./PolygonTreeNode'),
    G = require('../../geometry')

function Tree(polygons) {
    this.polygonTree = new PolygonTreeNode();
    this.rootnode = new Node(null);
    if (polygons) this.addPolygons(polygons);
};

Tree.prototype = {
    invert: function() {
        this.polygonTree.invert();
        this.rootnode.invert();
    },

    // Remove all polygons in this BSP tree that are inside the other BSP tree
    // `tree`.
    clipTo: function(tree, alsoRemovecoplanarFront) {
        alsoRemovecoplanarFront = alsoRemovecoplanarFront ? true : false;
        this.rootnode.clipTo(tree, alsoRemovecoplanarFront);
    },

    allPolygons: function() {
        var result = [];
        this.polygonTree.getPolygons(result);
        return result;
    },

    addPolygons: function(polygons) {
        var _this = this;
        var polygontreenodes = polygons.map(function(p) {
            return _this.polygonTree.addChild(p);
        });
        var i = 0,
            j = 0;
        polygons.forEach(function(n, ii) {
            // console.log(n)
                if (n.vertices.length === 4) {
                    i++
                }
                if (isNaN(n.plane.w)) {
                    j++
                }
                if (isNaN(n.plane.w)) {
                    console.log('bad polygon', n, n.plane, n.vertices, ii)
                    // var p = n.vertices
                    // n.plane = G.Plane.fromVector3Ds(p[0].pos, p[1].pos, p[3].pos);
                }
            })
            // console.log(i,j)
        this.rootnode.addPolygonTreeNodes(polygontreenodes);
    }
}
module.exports = Tree
