import Promise from 'bluebird'
import $ from '../dom'
import Solid from '../solid'

import {render, renderElementList} from './render'

export default function render_craft(element, scope) {
    scope.solid.role = 'define'
    element.contents = $(element).getContentParameters()
    scope.crafts[element.attribs['name']] = element
}
