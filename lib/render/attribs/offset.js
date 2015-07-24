import _ from 'lodash'
import $ from '../../dom'

export default function _offset_attribute(solids, element, scope) {

    var craft = scope.renderable

    var loc = {}
    // apply x, y, z offsets (if any),
    // but not for those using x, y, z as parameters (e.g., scale, crop)
    var dims = ['x', 'y', 'z']
    dims.forEach(function(dim) {
        if (element.attribs[dim] && $(craft).hasParameterByName(dim)) {
            var resolved = scope.parent.resolve(element.attribs[dim])
            loc[dim] = Number(resolved)
        }
    })

    solids.forEach(function(solid) {
        var oldloc = _.clone(solid.position)
        var newloc = _.merge(oldloc, loc)
        solid.translateTo(newloc.x, newloc.y, newloc.z)
    })
}
