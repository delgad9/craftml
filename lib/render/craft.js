import Promise from 'bluebird'
import $ from '../dom'

export default function _render_craft(render, element, scope) {

    if (scope.isRoot) {

        var childScope = scope.clone()
        return render(element.children, childScope)

    } else {

        // compute all <content> parameters of this craft
        element.contents = $(element).getContentParameters()

        scope.crafts[element.attribs['name']] = element

        return []
    }

}
