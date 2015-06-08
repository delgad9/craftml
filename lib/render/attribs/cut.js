var select = require('../select'),
    Solid = require('../../solid'),
    _s = require('../../solids')

module.exports = function(solids, element, scope) {

    var selector = element.attribs['cut']
    var selected = select(solids, selector)
    var notselected = select(solids, '!'+selector)

    solids.forEach(function(solid) {
        solid.apply()
    })

    var csg0 = _s(selected).union()
    var csg1 = _s(notselected).union()

    var csg = csg1.subtract(csg0)
    var solid = new Solid(csg)
    solids = [solid]
    return solids
}
