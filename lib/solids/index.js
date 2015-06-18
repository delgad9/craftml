var _ = require('lodash')

//
// utility methods operating on an array of Solid objects
//
module.exports = util

function util(solids){
    return new SolidsUtil(solids)
}

function SolidsUtil(solids) {
    this.solids = solids
}

SolidsUtil.prototype.apply = function() {
    _.forEach(this.solids, function(s) {
        s.apply()
    })
}

var collect = require('./collect')
SolidsUtil.prototype.csgs = function() {
    return collect(this.solids)
}

var union = require('./union')
SolidsUtil.prototype.union = function() {
    var csgs = this.csgs()
    var csg = union(csgs)
    return csg
}

var flatten = require('./flatten')
SolidsUtil.prototype.flatten = function() {
    return flatten(this.solids)
}
