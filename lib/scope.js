var _ = require('lodash'),
    addWith = require('with')

export default class Scope {

    constructor() {
        this.elements = []
        this.parameters = {}
        this.crafts = {}
        this.parts = {}
    }

    clone() {
        var copy = new Scope()
        _.extend(copy, this)
        copy.crafts = _.clone(this.crafts)
        copy.parts = _.clone(this.parts)
        copy.parameters = _.clone(this.parameters)
        copy.isRoot = false
        return copy
    }

    // resolve an expression into an "object" or a "string", using the scope's
    // parameters
    resolve(value) {

        if (_.isString(value)) {

            // resolve {{ }}

            // if the expression has any {{ }}
            var res = value.match(/{{(.*)}}/)
            if (res) {


                if (value.match(/^{{([^{^}]*)}}$/)){
                    // <foo x="{{obj}}"/>

                    // console.log('eval as an object')
                    var expr = res[1]
                    var env = this.parameters
                    var withExpr = addWith('env', 'return ' + expr)
                    var f = new Function('env', withExpr)
                    // console.log(env, expr, res, f, withExpr)
                    return f(env)

                } else {
                    // <foo x="bar({{obj}})"/>

                    // console.log('eval as a template')
                    _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
                    var compiled = _.template(value)
                    var ret = compiled(this.parameters)
                    return ret  // string
                }

            } else {

                return value
            }

        } else {

            return value
        }
    }

}
