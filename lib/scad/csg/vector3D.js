// # class Vector3D
// Represents a 3D vector.
//
// Example usage:
//
//     new Vector3D(1, 2, 3);
//     new Vector3D([1, 2, 3]);
//     new Vector3D({ x: 1, y: 2, z: 3 });
//     new Vector3D(1, 2); // assumes z=0
//     new Vector3D([1, 2]); // assumes z=0

var _ = require('lodash')
    Vector2D = require('./vector2D')

function Vector3D(x, y, z) {
    if (arguments.length == 3) {
        this._x = parseFloat(x);
        this._y = parseFloat(y);
        this._z = parseFloat(z);
    } else if (arguments.length == 2) {
        this._x = parseFloat(x);
        this._y = parseFloat(y);
        this._z = 0;
    } else {
        var ok = true;
        if (arguments.length == 1) {
            if (typeof(x) == "object") {
                if (x instanceof Vector3D) {
                    this._x = x._x;
                    this._y = x._y;
                    this._z = x._z;
                } else if (x instanceof Vector2D) {
                    this._x = x._x;
                    this._y = x._y;
                    this._z = 0;
                } else if (x instanceof Array) {
                    if ((x.length < 2) || (x.length > 3)) {
                        ok = false;
                    } else {
                        this._x = parseFloat(x[0]);
                        this._y = parseFloat(x[1]);
                        if (x.length == 3) {
                            this._z = parseFloat(x[2]);
                        } else {
                            this._z = 0;
                        }
                    }
                } else if (('x' in x) && ('y' in x)) {
                    this._x = parseFloat(x.x);
                    this._y = parseFloat(x.y);
                    if ('z' in x) {
                        this._z = parseFloat(x.z);
                    } else {
                        this._z = 0;
                    }
                } else ok = false;
            } else {
                var v = parseFloat(x);
                this._x = v;
                this._y = v;
                this._z = v;
            }
        } else ok = false;
        if (ok) {
            if ((!_.isNumber(this._x)) || (!_.isNumber(this._y)) || (!_.isNumber(this._z))) ok = false;
        }
        if (!ok) {
            throw new Error("wrong arguments");
        }
    }
};

Vector3D.prototype = {
    get x() {
        return this._x;
    },
    get y() {
        return this._y;
    },
    get z() {
        return this._z;
    },

    set x(v) {
        throw new Error("Vector3D is immutable");
    },
    set y(v) {
        throw new Error("Vector3D is immutable");
    },
    set z(v) {
        throw new Error("Vector3D is immutable");
    },

    clone: function() {
        return new Vector3D(this);
    },

    negated: function() {
        return new Vector3D(-this._x, -this._y, -this._z);
    },

    abs: function() {
        return new Vector3D(Math.abs(this._x), Math.abs(this._y), Math.abs(this._z));
    },

    plus: function(a) {
        return new Vector3D(this._x + a._x, this._y + a._y, this._z + a._z);
    },

    minus: function(a) {
        return new Vector3D(this._x - a._x, this._y - a._y, this._z - a._z);
    },

    times: function(a) {
        return new Vector3D(this._x * a, this._y * a, this._z * a);
    },

    dividedBy: function(a) {
        return new Vector3D(this._x / a, this._y / a, this._z / a);
    },

    dot: function(a) {
        return this._x * a._x + this._y * a._y + this._z * a._z;
    },

    lerp: function(a, t) {
        return this.plus(a.minus(this).times(t));
    },

    lengthSquared: function() {
        return this.dot(this);
    },

    length: function() {
        return Math.sqrt(this.lengthSquared());
    },

    unit: function() {
        return this.dividedBy(this.length());
    },

    cross: function(a) {
        return new Vector3D(
            this._y * a._z - this._z * a._y, this._z * a._x - this._x * a._z, this._x * a._y - this._y * a._x);
    },

    distanceTo: function(a) {
        return this.minus(a).length();
    },

    distanceToSquared: function(a) {
        return this.minus(a).lengthSquared();
    },

    equals: function(a) {
        return (this._x == a._x) && (this._y == a._y) && (this._z == a._z);
    },

    // Right multiply by a 4x4 matrix (the vector is interpreted as a row vector)
    // Returns a new Vector3D
    multiply4x4: function(matrix4x4) {
        return matrix4x4.leftMultiply1x3Vector(this);
    },

    transform: function(matrix4x4) {
        return matrix4x4.leftMultiply1x3Vector(this);
    },

    toStlString: function() {
        return this._x + " " + this._y + " " + this._z;
    },

    toAMFString: function() {
        return "<x>" + this._x + "</x><y>" + this._y + "</y><z>" + this._z + "</z>";
    },

    toString: function() {
        return "(" + this._x.toFixed(2) + ", " + this._y.toFixed(2) + ", " + this._z.toFixed(2) + ")";
    },

    // find a vector that is somewhat perpendicular to this one
    randomNonParallelVector: function() {
        var abs = this.abs();
        if ((abs._x <= abs._y) && (abs._x <= abs._z)) {
            return new Vector3D(1, 0, 0);
        } else if ((abs._y <= abs._x) && (abs._y <= abs._z)) {
            return new Vector3D(0, 1, 0);
        } else {
            return new Vector3D(0, 0, 1);
        }
    },

    min: function(p) {
        return new Vector3D(
            Math.min(this._x, p._x), Math.min(this._y, p._y), Math.min(this._z, p._z));
    },

    max: function(p) {
        return new Vector3D(
            Math.max(this._x, p._x), Math.max(this._y, p._y), Math.max(this._z, p._z));
    }
};

module.exports = Vector3D
