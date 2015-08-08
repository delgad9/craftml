import Promise from 'bluebird'
import $ from '../dom'
import Solid from '../solid'

export default function render_craft($scope) {
    this.role = 'define'
    this.src.contents = $(this.src).getContentParameters()
    $scope.crafts[this.src.attribs.name] = this.src
}
