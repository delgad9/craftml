var Group = require('../group')

module.exports = function(render, element, scope) {

    return render(element.children, scope)
        .then(function(solids) {

            var grp = new Group()
            grp.children = solids

            grp.fitToChildren()
            var s
            if (element.attribs.factor) {
                var f = Number(element.attribs.factor)
                s = {
                    x: f,
                    y: f,
                    z: f
                }
            } else {
                var x = Number(element.attribs.x) || 1
                var y = Number(element.attribs.y) || 1
                var z = Number(element.attribs.z) || 1
                s = {
                    x: x,
                    y: y,
                    z: z
                }
            }
            grp.scale(s)
            return grp

        })
}