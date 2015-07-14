import Promise from 'bluebird'
import $ from '../dom'
import Solid from '../solid'

import {render, renderElementList} from './render'

export default function render_group(render, element, scope) {

    console.log('rendering <group> with', element.children.length, 'children')

    // var grp = Solid.fromGroup(scope.solids)
    scope.solid.type = 'group'

    return renderElementList(element.children, scope)
        .then(solids => {
            console.log('    got', solids.length, 'solids')
            // let group = Solid.fromGroup(solids)
            return scope.solid// return group
        })
    }


    // solid.element = 'group'
    // solid.type = 'group'
    // scope.solids = [grp]
    // return grp

    // if (scope.isRoot) {
    //
    //     // var childScope = scope.clone()
    //     // let solid = new Solid()
    //     // solid.type = 'merge'
    //     // solid.element = element
    //     // childScope.solid = solid
    //     // console.log(childScope.solid)
    //     console.log('rendering children ', element.children.length)
    //     return renderElementList(element.children, scope)
    //         // .then(() => {
    //         //     return solid
    //         // })
    //
    // } else {
    //
    //     // compute all <content> parameters of this craft
    //     element.contents = $(element).getContentParameters()
    //
    //     scope.crafts[element.attribs['name']] = element
    //
    //     return []
    // }

// }
