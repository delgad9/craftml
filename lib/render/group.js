import {renderElementList} from './render'

export default function render_group($solid, $element, $scope) {
    return renderElementList($element.children, $scope)
}
