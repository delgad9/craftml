import Promise from 'bluebird'
import $ from '../dom'
import Solid from '../solid'

import {renderElementList} from './render'
import Craft from '../craft'

export default function render_craft($scope) {
    this.role = 'define'
    this.src.contents = $(this.src).getContentParameters()

    let name = this.src.attribs.name
    let craft = new Craft(this.src)
    if (this.src.name == 'craft'){
        craft.static = true
    } else {
        craft.static = false
    }

    $scope.crafts[name] = craft
}
