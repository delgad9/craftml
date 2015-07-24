import Promise from 'bluebird'
import $ from '../dom'
import Solid from '../solid'


export default function render_craft($solid, $element, $scope) {
    $solid.role = 'define'
    $element.contents = $($element).getContentParameters()
    $scope.crafts[$element.attribs['name']] = $element
}
