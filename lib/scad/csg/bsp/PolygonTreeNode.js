// # class PolygonTreeNode
// This class manages hierarchical splits of polygons
// At the top is a root node which doesn hold a polygon, only child PolygonTreeNodes
// Below that are zero or more 'top' nodes; each holds a polygon. The polygons can be in different planes
// splitByPlane() splits a node by a plane. If the plane intersects the polygon, two new child nodes
// are created holding the splitted polygon.
// getPolygons() retrieves the polygon from the tree. If for PolygonTreeNode the polygon is split but
// the two split parts (child nodes) are still intact, then the unsplit polygon is returned.
// This ensures that we can safely split a polygon into many fragments. If the fragments are untouched,
//  getPolygons() will return the original unsplit polygon instead of the fragments.
// remove() removes a polygon from the tree. Once a polygon is removed, the parent polygons are invalidated
// since they are no longer intact.
// constructor creates the root node:

function PolygonTreeNode() {
    this.parent = null;
    this.children = [];
    this.polygon = null;
    this.removed = false;
};

module.exports = PolygonTreeNode

PolygonTreeNode.prototype = {
    // fill the tree with polygons. Should be called on the root node only; child nodes must
    // always be a derivate (split) of the parent node.
    addPolygons: function(polygons) {
        if (!this.isRootNode())
        // new polygons can only be added to root node; children can only be splitted polygons
            throw new Error("Assertion failed");
        var _this = this;
        polygons.map(function(polygon) {
            _this.addChild(polygon);
        });
    },

    // remove a node
    // - the siblings become toplevel nodes
    // - the parent is removed recursively
    remove: function() {
        if (!this.removed) {
            this.removed = true;

            // if (_CSGDEBUG) {
            //     if (this.isRootNode()) throw new Error("Assertion failed"); // can't remove root node
            //     if (this.children.length) throw new Error("Assertion failed"); // we shouldn't remove nodes with children
            // }

            // remove ourselves from the parent's children list:
            var parentschildren = this.parent.children;
            var i = parentschildren.indexOf(this);
            if (i < 0) throw new Error("Assertion failed");
            parentschildren.splice(i, 1);

            // invalidate the parent's polygon, and of all parents above it:
            this.parent.recursivelyInvalidatePolygon();
        }
    },

    isRemoved: function() {
        return this.removed;
    },

    isRootNode: function() {
        return !this.parent;
    },

    // invert all polygons in the tree. Call on the root node
    invert: function() {
        if (!this.isRootNode()) throw new Error("Assertion failed"); // can only call this on the root node
        this.invertSub();
    },

    getPolygon: function() {
        if (!this.polygon) throw new Error("Assertion failed"); // doesn't have a polygon, which means that it has been broken down
        return this.polygon;
    },

    getPolygons: function(result) {
        if (this.polygon) {
            // the polygon hasn't been broken yet. We can ignore the children and return our polygon:
            result.push(this.polygon);
        } else {
            // our polygon has been split up and broken, so gather all subpolygons from the children:
            var childpolygons = [];
            this.children.map(function(child) {
                child.getPolygons(childpolygons);
            });
            childpolygons.map(function(p) {
                result.push(p);
            });
        }
    },

    // split the node by a plane; add the resulting nodes to the frontnodes and backnodes array
    // If the plane doesn't intersect the polygon, the 'this' object is added to one of the arrays
    // If the plane does intersect the polygon, two new child nodes are created for the front and back fragments,
    //  and added to both arrays.
    splitByPlane: function(plane, coplanarfrontnodes, coplanarbacknodes, frontnodes, backnodes) {
        var children = this.children;
        var numchildren = children.length;
        if (numchildren > 0) {
            // if we have children, split the children
            for (var i = 0; i < numchildren; i++) {
                children[i].splitByPlane(plane, coplanarfrontnodes, coplanarbacknodes, frontnodes, backnodes);
            }
        } else {
            // no children. Split the polygon:
            var polygon = this.polygon;
            if (polygon) {
                var bound = polygon.boundingSphere();
                var sphereradius = bound[1] + 1e-4;
                var planenormal = plane.normal;
                var spherecenter = bound[0];
                var d = planenormal.dot(spherecenter) - plane.w;
                if (d > sphereradius) {
                    frontnodes.push(this);
                } else if (d < -sphereradius) {
                    backnodes.push(this);
                } else {
                    var splitresult = plane.splitPolygon(polygon);
                    switch (splitresult.type) {
                        case 0:
                            // coplanar front:
                            coplanarfrontnodes.push(this);
                            break;

                        case 1:
                            // coplanar back:
                            coplanarbacknodes.push(this);
                            break;

                        case 2:
                            // front:
                            frontnodes.push(this);
                            break;

                        case 3:
                            // back:
                            backnodes.push(this);
                            break;

                        case 4:
                            // spanning:
                            if (splitresult.front) {
                                var frontnode = this.addChild(splitresult.front);
                                frontnodes.push(frontnode);
                            }
                            if (splitresult.back) {
                                var backnode = this.addChild(splitresult.back);
                                backnodes.push(backnode);
                            }
                            break;
                    }
                }
            }
        }
    },


    // PRIVATE methods from here:
    // add child to a node
    // this should be called whenever the polygon is split
    // a child should be created for every fragment of the split polygon
    // returns the newly created child
    addChild: function(polygon) {
        var newchild = new PolygonTreeNode();
        newchild.parent = this;
        newchild.polygon = polygon;
        this.children.push(newchild);
        return newchild;
    },

    invertSub: function() {
        if (this.polygon) {
            this.polygon = this.polygon.flipped();
        }
        this.children.map(function(child) {
            child.invertSub();
        });
    },

    recursivelyInvalidatePolygon: function() {
        if (this.polygon) {
            this.polygon = null;
            if (this.parent) {
                this.parent.recursivelyInvalidatePolygon();
            }
        }
    }
}
