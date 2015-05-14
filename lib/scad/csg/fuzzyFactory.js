module.exports = function(CSG) {

    ////////////////////////////////
    // ## class fuzzyFactory
    // This class acts as a factory for objects. We can search for an object with approximately
    // the desired properties (say a rectangle with width 2 and height 1)
    // The lookupOrCreate() method looks for an existing object (for example it may find an existing rectangle
    // with width 2.0001 and height 0.999. If no object is found, the user supplied callback is
    // called, which should generate a new object. The new object is inserted into the database
    // so it can be found by future lookupOrCreate() calls.
    // Constructor:
    //   numdimensions: the number of parameters for each object
    //     for example for a 2D rectangle this would be 2
    //   tolerance: The maximum difference for each parameter allowed to be considered a match
    CSG.fuzzyFactory = function(numdimensions, tolerance) {
        var lookuptable = [];
        for (var i = 0; i < numdimensions; i++) {
            lookuptable.push({});
        }
        this.lookuptable = lookuptable;
        this.nextElementId = 1;
        this.multiplier = 1.0 / tolerance;
        this.objectTable = {};
    };

    CSG.fuzzyFactory.prototype = {
        // var obj = f.lookupOrCreate([el1, el2, el3], function(elements) {/* create the new object */});
        // Performs a fuzzy lookup of the object with the specified elements.
        // If found, returns the existing object
        // If not found, calls the supplied callback function which should create a new object with
        // the specified properties. This object is inserted in the lookup database.
        lookupOrCreate: function(els, creatorCallback) {
            var object;
            var key = this.lookupKey(els);
            if (key === null) {
                object = creatorCallback(els);
                key = this.nextElementId++;
                this.objectTable[key] = object;
                for (var dimension = 0; dimension < els.length; dimension++) {
                    var elementLookupTable = this.lookuptable[dimension];
                    var value = els[dimension];
                    var valueMultiplied = value * this.multiplier;
                    var valueQuantized1 = Math.floor(valueMultiplied);
                    var valueQuantized2 = Math.ceil(valueMultiplied);
                    CSG.fuzzyFactory.insertKey(key, elementLookupTable, valueQuantized1);
                    CSG.fuzzyFactory.insertKey(key, elementLookupTable, valueQuantized2);
                }
            } else {
                object = this.objectTable[key];
            }
            return object;
        },

        // ----------- PRIVATE METHODS:
        lookupKey: function(els) {
            var keyset = {};
            for (var dimension = 0; dimension < els.length; dimension++) {
                var elementLookupTable = this.lookuptable[dimension];
                var value = els[dimension];
                var valueQuantized = Math.round(value * this.multiplier);
                valueQuantized += "";
                if (valueQuantized in elementLookupTable) {
                    if (dimension === 0) {
                        keyset = elementLookupTable[valueQuantized];
                    } else {
                        keyset = CSG.fuzzyFactory.intersectSets(keyset, elementLookupTable[valueQuantized]);
                    }
                } else {
                    return null;
                }
                if (CSG.fuzzyFactory.isEmptySet(keyset)) return null;
            }
            // return first matching key:
            for (var key in keyset) return key;
            return null;
        },

        lookupKeySetForDimension: function(dimension, value) {
            var result;
            var elementLookupTable = this.lookuptable[dimension];
            var valueMultiplied = value * this.multiplier;
            var valueQuantized = Math.floor(value * this.multiplier);
            if (valueQuantized in elementLookupTable) {
                result = elementLookupTable[valueQuantized];
            } else {
                result = {};
            }
            return result;
        }
    };

    CSG.fuzzyFactory.insertKey = function(key, lookuptable, quantizedvalue) {
        if (quantizedvalue in lookuptable) {
            lookuptable[quantizedvalue][key] = true;
        } else {
            var newset = {};
            newset[key] = true;
            lookuptable[quantizedvalue] = newset;
        }
    };

    CSG.fuzzyFactory.isEmptySet = function(obj) {
        for (var key in obj) return false;
        return true;
    };

    CSG.fuzzyFactory.intersectSets = function(set1, set2) {
        var result = {};
        for (var key in set1) {
            if (key in set2) {
                result[key] = true;
            }
        }
        return result;
    };

    CSG.fuzzyFactory.joinSets = function(set1, set2) {
        var result = {},
            key;
        for (key in set1) {
            result[key] = true;
        }
        for (key in set2) {
            result[key] = true;
        }
        return result;
    };

}
