var parse = {}


// Parse an option from the options object
// If the option is not present, return the default value
parse.parse = function(options, optionname, defaultvalue) {
    var result = defaultvalue;
    if (options) {
        if (optionname in options) {
            result = options[optionname];
        }
    }
    return result;
};

// Parse an option and force into a parse.Vector3D. If a scalar is passed it is converted
// into a vector with equal x,y,z
parse.parseAs3DVector = function(options, optionname, defaultvalue) {
    var G = require('../../geometry')
    var result = parse.parse(options, optionname, defaultvalue);
    result = new G.Vector3D(result);
    return result;
};

// Parse an option and force into a parse.Vector2D. If a scalar is passed it is converted
// into a vector with equal x,y
parse.parseAs2DVector = function(options, optionname, defaultvalue) {
    var G = require('../../geometry')
    var result = parse.parse(options, optionname, defaultvalue);
    result = new G.Vector2D(result);
    return result;
};

parse.parseAsFloat = function(options, optionname, defaultvalue) {
    var result = parse.parse(options, optionname, defaultvalue);
    if (typeof(result) == "string") {
        result = Number(result);
    }
    if (isNaN(result) || typeof(result) != "number") {
        throw new Error("Parameter " + optionname + " should be a number");
    }
    return result;
};

parse.parseAsInt = function(options, optionname, defaultvalue) {
    var result = parse.parse(options, optionname, defaultvalue);
    result = Number(Math.floor(result));
    if (isNaN(result)) {
        throw new Error("Parameter " + optionname + " should be a number");
    }
    return result;
};

parse.parseAsBool = function(options, optionname, defaultvalue) {
    var result = parse.parse(options, optionname, defaultvalue);
    if (typeof(result) == "string") {
        if (result == "true") result = true;
        else if (result == "false") result = false;
        else if (result == 0) result = false;
    }
    result = !!result;
    return result;
}

module.exports = parse
