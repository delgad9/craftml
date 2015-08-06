import Promise from 'bluebird'
import $ from '../dom'
import Solid from '../solid'

export default function render_craft($element, $scope) {
    this.role = 'define'
    $element.contents = $($element).getContentParameters()
    $scope.crafts[$element.attribs['name']] = $element
}
