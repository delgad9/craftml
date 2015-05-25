var _ = require('lodash'),
    addWith = require('with'),
    Promise = require("bluebird")

module.exports = function(render, element, scope) {
    // scope.parent is important for getting nested <content> tags ot work

    // inject scope.locals as paremeters to the parent scope
    _.forEach(element.attribs, function(val, key) {

        var m = val.match(/{{(.*)}}/)
        var valExpr = m[1]
        var expr = addWith('scope.locals', 'scope.parent.parameters[\'' + key + '\'] = ' + valExpr)
        eval(expr)
    })

    // check if it's being called (i.e., having a caller)
    if (scope.parent) {
        return render(scope.caller.children, scope.parent)
    } else {
        // if not, render nothing
        return Promise.resolve([])
    }
}
