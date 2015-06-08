var _ = require('lodash')

// simple implementation of css-style selector
//
// only the following are supported
//
//
// #foo
// .boo
//
// !#foo
// !.boo
//
//
// no error handling

module.exports = function select(solids, selector) {
    return _.flatten(_.map(solids, function(solid) {
        var selected = []
        if (isMatch(solid, selector)) {
            selected.push(solid)
        }
        return selected.concat(select(solid.children, selector))
    }))
}


function isMatch(solid, selector) {
    var name = selector.slice(1)
    if (selector[0] == '!') {
        return !isMatch(solid, selector.slice(1))
    } else if (selector[0] == '#') {
        return solid.id == name
    } else if (selector[0] == '.') {
        return solid.class == name
    } else {
        return false
    }
}
