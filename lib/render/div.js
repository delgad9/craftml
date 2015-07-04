import Promise from 'bluebird'
import css from 'css'
import _ from 'lodash'
import Solid from '../solid'

export default function render_div(render, element, scope) {

    let [cssText = ''] = [element.attribs['style']]

    let ast = css.parse('div {' + cssText + '}')

    let innerScope = scope.clone()

    _.extend(innerScope.style, element.style)

    _.forEach(ast.stylesheet.rules[0].declarations, decl => {
        innerScope.style[decl.property] = decl.value
    })

    // console.log(innerScope.style)

    return render(element.children, innerScope)
        .then(solids => {
            let group = Solid.fromGroup(solids)

            let style = element.style || {}
            console.log('style', style)
            let v
            // perform alignments
            if (v = style['text-align']){
                if (v == 'left'){
                    group.layoutEval('alignX(0%) lineupY(5)')
                } else if (v == 'right'){
                    group.layoutEval('alignX(100%) lineupY(5)')
                } else if (v == 'center'){
                    group.layoutEval('alignX(50%) lineupY(5)')
                }
            }

            return group
        })
}
