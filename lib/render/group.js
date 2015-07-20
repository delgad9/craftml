import Promise from 'bluebird'
import $ from '../dom'
import Solid from '../solid'

import {render, renderElementList} from './render'

export default function render_group(render, element, scope) {

    return renderElementList(element.children, scope)
        .then(solids => {
            scope.solid.fitToChildren()
            return scope.solid
        })
    }
