var _ = require('lodash'),
    Group = require('../group')

module.exports = function(render, element, scope) {

    return render(element.children, scope)
        .then(function(solids) {

            var grp = new Group()
            grp.children = _.flatten(solids)
            grp.fitToChildren()
            return grp

        })
}