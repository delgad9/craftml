var _ = require('lodash')
var addWith = require('with')

module.exports = function(render, element, scope) {
    // scope.parent is important for getting nested <content> tags ot work

    _.forEach(element.attribs, function(val, key){

        var m = val.match(/{{(.*)}}/)
        var valExpr = m[1]
        var expr = addWith('scope.locals', 'scope.parent.parameters[\'' + key + '\'] = ' + valExpr)
        eval(expr)
    })
    return render(scope.caller.children, scope.parent)
}