import Promise from 'bluebird'
import css from 'css'
import _ from 'lodash'
import Solid from '../solid'

export default function render_div(render, element, scope) {

    let cssText = element.attribs['style']
    let ast = css.parse('div {' + cssText + '}')

    let innerScope = scope.clone()

    _.forEach(ast.stylesheet.rules[0].declarations, decl => {
        innerScope.style[decl.property] = decl.value
    })

    return render(element.children, innerScope)
        .then(solids => {
            return Solid.fromGroup(solids)
        })
}
