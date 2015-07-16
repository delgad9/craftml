import Promise from 'bluebird'
import $ from '../dom'
import Solid from '../solid'

import {render, renderElementList} from './render'

export default function _render_craft(render, element, scope) {

    if (scope.isRoot) {

        // var childScope = scope.clone()
        // let solid = new Solid()
        // solid.type = 'merge'
        // solid.element = element
        // childScope.solid = solid
        // console.log(childScope.solid)
        console.log('rendering children ', element.children.length)
        return renderElementList(element.children, scope)
            // .then(() => {
            //     return solid
            // })

    } else {

        // compute all <content> parameters of this craft
        scope.solid.role = 'define'
        element.contents = $(element).getContentParameters()
        console.log(`defining craft(name=${element.attribs['name']})`)
        scope.crafts[element.attribs['name']] = element

        return []
    }

}
