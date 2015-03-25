var _ = require('lodash')

module.exports = _collect_csgs

function _collect_csgs(arg) {

    var solids
    if (_.isArray(arg)) {
        solids = arg
    } else {
        solids = [arg]
    }

    var csgs = []
    solids.forEach(function(solid) {
        _collect_csgs_helper(solid, csgs)
    })

    return csgs
}

function _collect_csgs_helper(node, acc) {

    if (node.csg) {
        acc.push(node.csg)
    }

    if (node.children) {
        node.children.forEach(function(s) {
            return _collect_csgs_helper(s, acc)
        })
    }
}