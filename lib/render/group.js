import {renderElementList} from './render'

export default function render_group($solid, $element, $scope) {
    // TODO: move this somewhere else?
    if ($element.attribs['grouping'] == 'off'){
        $solid.role = 'merge'
    }

    return renderElementList($solid, $element.children, $scope)
}
