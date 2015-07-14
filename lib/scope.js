import _ from 'lodash'
import addWith from 'with'
import CSSselect from 'css-select'
import Solid from './solid'

export default class Scope {

    constructor() {

        this.parameters = {}
        this.crafts = {}
        this.parts = {}

        // solid to be constructed from this scope
        // this.solid = new Solid()
        // this.solid.type = 'merge'

        // list of css rules applicable within this scope
        this.css = []
    }

    clone() {
        var copy = new Scope()
        _.extend(copy, this)
        copy.crafts = _.clone(this.crafts)
        copy.parts = _.clone(this.parts)
        copy.parameters = _.clone(this.parameters)
        copy.isRoot = false
        copy.css = _.clone(this.css)
        // copy.solid = new Solid()
        // copy.solid.type = 'merge'
        return copy
    }

    // compute the style for an element according to the css rules in this scope
    computeStyle(element){

        let selectedCSSRules =
            _.filter(this.css,
                r => { return CSSselect.is(element, r.selectors.join(','))})

        let computedStyle = {}
        function setProperty(decl){

            if (decl.value == 'inherit' && element.parent){
                // console.log('inherit', element.parent.style)
                computedStyle[decl.property] = element.parent.style[decl.property]

            } else {

                computedStyle[decl.property] = decl.value

            }
        }

        _.forEach(selectedCSSRules, rule => {
            _.forEach(rule.declarations, decl => {
                setProperty(decl)
            })
        })
        return computedStyle
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
