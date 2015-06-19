var _ = require('lodash')

module.exports = _flatten

function _flatten(arg) {

    var solids
    if (_.isArray(arg)) {
        solids = arg
    } else {
        solids = [arg]
    }

    var acc = []
    solids.forEach(function(solid) {
        _flatten_helper(solid, acc)
    })

    return acc
}

function _flatten_helper(node, acc) {

    if (node) {
        acc.push(node)
    }

    if (node.children) {
        node.children.forEach(function(s) {
            return _flatten_helper(s, acc)
        })
    }
}
