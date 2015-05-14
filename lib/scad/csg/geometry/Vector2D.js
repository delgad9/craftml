var Vector3D = require('./Vector3D'),
    _ = require('lodash')

///////////////////////////////////////////////////
// # class Vector2D:
// Represents a 2 element vector
function Vector2D(x, y) {
    if(arguments.length == 2) {
        this._x = parseFloat(x);
        this._y = parseFloat(y);
    } else {
        var ok = true;
        if(arguments.length == 1) {
            if(typeof(x) == "object") {
                if(x instanceof Vector2D) {
                    this._x = x._x;
                    this._y = x._y;
                } else if(x instanceof Array) {
                    this._x = parseFloat(x[0]);
                    this._y = parseFloat(x[1]);
                } else if(('x' in x) && ('y' in x)) {
                    this._x = parseFloat(x.x);
                    this._y = parseFloat(x.y);
                } else ok = false;
            } else {
                var v = parseFloat(x);
                this._x = v;
                this._y = v;
            }
        } else ok = false;
        if(ok) {
            if((!_.isNumber(this._x)) || (!_.isNumber(this._y))) ok = false;
        }
        if(!ok) {
            throw new Error("wrong arguments");
        }
    }
};

Vector2D.fromAngle = function(radians) {
    return Vector2D.fromAngleRadians(radians);
};

Vector2D.fromAngleDegrees = function(degrees) {
    var radians = Math.PI * degrees / 180;
    return Vector2D.fromAngleRadians(radians);
};

Vector2D.fromAngleRadians = function(radians) {
    return new Vector2D(Math.cos(radians), Math.sin(radians));
};

Vector2D.prototype = {
    get x() {
        return this._x;
    }, get y() {
        return this._y;
    },

    set x(v) {
        throw new Error("Vector2D is immutable");
    }, set y(v) {
        throw new Error("Vector2D is immutable");
    },

    // extend to a 3D vector by adding a z coordinate:
    toVector3D: function(z) {
        return new Vector3D(this._x, this._y, z);
    },

    equals: function(a) {
        return(this._x == a._x) && (this._y == a._y);
    },

    clone: function() {
        return new Vector2D(this._x, this._y);
    },

    negated: function() {
        return new Vector2D(-this._x, -this._y);
    },

    plus: function(a) {
        return new Vector2D(this._x + a._x, this._y + a._y);
    },

    minus: function(a) {
        return new Vector2D(this._x - a._x, this._y - a._y);
    },

    times: function(a) {
        return new Vector2D(this._x * a, this._y * a);
    },

    dividedBy: function(a) {
        return new Vector2D(this._x / a, this._y / a);
    },

    dot: function(a) {
        return this._x * a._x + this._y * a._y;
    },

    lerp: function(a, t) {
        return this.plus(a.minus(this).times(t));
    },

    length: function() {
        return Math.sqrt(this.dot(this));
    },

    distanceTo: function(a) {
        return this.minus(a).length();
    },

    distanceToSquared: function(a) {
        return this.minus(a).lengthSquared();
    },

    lengthSquared: function() {
        return this.dot(this);
    },

    unit: function() {
        return this.dividedBy(this.length());
    },

    cross: function(a) {
        return this._x * a._y - this._y * a._x;
    },

    // returns the vector rotated by 90 degrees clockwise
    normal: function() {
        return new Vector2D(this._y, -this._x);
    },

    // Right multiply by a 4x4 matrix (the vector is interpreted as a row vector)
    // Returns a new Vector2D
    multiply4x4: function(matrix4x4) {
        return matrix4x4.leftMultiply1x2Vector(this);
    },

    transform: function(matrix4x4) {
        return matrix4x4.leftMultiply1x2Vector(this);
    },

    angle: function() {
        return this.angleRadians();
    },

    angleDegrees: function() {
        var radians = this.angleRadians();
        return 180 * radians / Math.PI;
    },

    angleRadians: function() {
        // y=sin, x=cos
        return Math.atan2(this._y, this._x);
    },

    min: function(p) {
        return new Vector2D(
        Math.min(this._x, p._x), Math.min(this._y, p._y));
    },

    max: function(p) {
        return new Vector2D(
        Math.max(this._x, p._x), Math.max(this._y, p._y));
    },

    toString: function() {
        return "("+this._x.toFixed(2)+", "+this._y.toFixed(2)+")";
    }
}

module.exports = Vector2D
