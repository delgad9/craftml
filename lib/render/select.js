var _ = require('lodash')

function isMatch(solid, selector){
    var name = selector.slice(1)
    if (selector[0] == '#'){
        return solid.id == name //|| solid.attribs.id == name
    } else if (selector[0] == '.'){
        return solid.class == name //|| solid.attribs.class == name
    } else {
        return false
    }
}

function select(solids, selector){
    return _.flatten(_.map(solids, function(solid){
        var selected = []
        if (isMatch(solid, selector)){
            selected.push(solid)
        }
        return selected.concat(select(solid.children, selector))
    }))
}

function notselect(solids, selector){
    return _.flatten(_.map(solids, function(solid){
        var selected = []
        if (!isMatch(solid, selector)){
            selected.push(solid)
        }
        return selected.concat(select(solid.children, selector))
    }))
}

module.exports = select
