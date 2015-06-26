//////////////////////////////////////
// # Class Properties
// This class is used to store properties of a solid
// A property can for example be a Vertex, a Plane or a Line3D
// Whenever an affine transform is applied to the CSG solid, all its properties are
// transformed as well.
// The properties can be stored in a complex nested structure (using arrays and objects)



function Properties() {};

Properties.prototype = {
    _transform: function(matrix4x4) {
        var result = new Properties();
        Properties.transformObj(this, result, matrix4x4);
        return result;
    },
    _merge: function(otherproperties) {
        var result = new Properties();
        Properties.cloneObj(this, result);
        Properties.addFrom(result, otherproperties);
        return result;
    }
};

Properties.transformObj = function(source, result, matrix4x4) {
    for (var propertyname in source) {
        if (propertyname == "_transform") continue;
        if (propertyname == "_merge") continue;
        var propertyvalue = source[propertyname];
        var transformed = propertyvalue;
        if (typeof(propertyvalue) == "object") {
            if (('transform' in propertyvalue) && (typeof(propertyvalue.transform) == "function")) {
                transformed = propertyvalue.transform(matrix4x4);
            } else if (propertyvalue instanceof Array) {
                transformed = [];
                Properties.transformObj(propertyvalue, transformed, matrix4x4);
            } else if (propertyvalue instanceof Properties) {
                transformed = new Properties();
                Properties.transformObj(propertyvalue, transformed, matrix4x4);
            }
        }
        result[propertyname] = transformed;
    }
};

Properties.cloneObj = function(source, result) {
    for (var propertyname in source) {
        if (propertyname == "_transform") continue;
        if (propertyname == "_merge") continue;
        var propertyvalue = source[propertyname];
        var cloned = propertyvalue;
        if (typeof(propertyvalue) == "object") {
            if (propertyvalue instanceof Array) {
                cloned = [];
                for (var i = 0; i < propertyvalue.length; i++) {
                    cloned.push(propertyvalue[i]);
                }
            } else if (propertyvalue instanceof Properties) {
                cloned = new Properties();
                Properties.cloneObj(propertyvalue, cloned);
            }
        }
        result[propertyname] = cloned;
    }
};

Properties.addFrom = function(result, otherproperties) {
    for (var propertyname in otherproperties) {
        if (propertyname == "_transform") continue;
        if (propertyname == "_merge") continue;
        if ((propertyname in result) &&
            (typeof(result[propertyname]) == "object") &&
            (result[propertyname] instanceof Properties) &&
            (typeof(otherproperties[propertyname]) == "object") &&
            (otherproperties[propertyname] instanceof Properties)) {
            Properties.addFrom(result[propertyname], otherproperties[propertyname]);
        } else if (!(propertyname in result)) {
            result[propertyname] = otherproperties[propertyname];
        }
    }
}

module.exports = Properties
