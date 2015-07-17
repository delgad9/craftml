import _ from 'lodash'

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

export default function select(solids, selector) {
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
        return _.get(solid,'element.attribs.id') == name
    } else if (selector[0] == '.') {
        return _.get(solid,'element.attribs.class') == name
    } else {
        return false
    }
}
