var select = require('../select'),
    Solid = require('../../solid'),
    _s = require('../../solids')

export default function(solid, element, scope) {

    var selector = element.attribs['cut']
    var selected = select(solid.children, selector)
    var notselected = select(solid.children, '!'+selector)

    solid.apply()

    var csg0 = _s(selected).union()
    var csg1 = _s(notselected).union()

    var csg = csg1.subtract(csg0)
    solid.children = []
    solid.add(csg)
}
