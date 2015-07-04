import Promise from 'bluebird'
import css from 'css'
import CSSselect from 'css-select'
import _ from 'lodash'
import Solid from '../solid'


export default function render_style(render, element, scope) {

    let [cssText = ''] = [element.children[0].data]//['style']]
    let ast = css.parse(cssText)

    _.forEach(ast.stylesheet.rules, rule => {

        let style = {}
        _.forEach(rule.declarations, decl => {
            style[decl.property] = decl.value
        })

        // TODO: handle multiple selectors
        let selector = rule.selectors[0]
        let matches = CSSselect(selector, element.parent)

        _.forEach(matches, m => {
            // merge?
            m.style = style
        })

    })
}
