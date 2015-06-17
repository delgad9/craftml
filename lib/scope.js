module.exports = Scope

var _ = require('lodash')

function Scope() {
    this.elements = []
    this.parameters = {}
    this.crafts = {}
    this.parts = {}
}

Scope.prototype.addElement = function(element) {
    this.elements.push(element)
}

Scope.prototype.getElementByName = function(name) {
    return _.find(this.elements, {
        name: name
    })
}

Scope.prototype.clone = function() {
    var copy = new Scope()
    _.extend(copy, this)

    // why commenting this out?
    copy.crafts = _.clone(this.crafts)
    copy.parameters = _.clone(this.parameters)
    copy.isRoot = false
    return copy
}

var addWith = require('with')
// eval an expression within the scope parameters
Scope.prototype.eval = function(expr){
    var o = {}
    var withExpr = addWith('this.parameters', 'o.v = ' + expr)
    eval(withExpr)
    return o.v
}


Scope.prototype.resolve = function(value) {
    if (_.isString(value)) {

        // resolve {{ }}

        // if the expression has any {{ }}
        var res = value.match(/{{(.*)}}/)
        if (res) {


            if (value.match(/^{{([^{^}]*)}}$/)){
                // <foo x="{{obj}}"/>

                // console.log('eval as an object')

                var o = {}
                var expr = res[1]
                var withExpr = addWith('this.parameters', 'o.v = ' + expr)
                eval(withExpr)
                // console.log(o.v)
                return o.v

            } else {
                // <foo x="bar({{obj}})"/>

                // console.log('eval as a template')
                _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
                var compiled = _.template(value)
                var ret = compiled(this.parameters)
                return ret
            }

        } else {

            return value
        }

    } else {

        return value
    }
}
