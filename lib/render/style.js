import Promise from 'bluebird'
import css from 'css'
import CSSselect from 'css-select'
import _ from 'lodash'
import Solid from '../solid'

export default function render_style(render, element, scope) {
    let [cssText = ''] = [element.children[0].data]
    let ast = css.parse(cssText)
    scope.css = scope.css.concat(ast.stylesheet.rules)
}
