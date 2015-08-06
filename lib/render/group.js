import {renderElementList} from './render'

export default function render_group($element, $scope) {
    // TODO: move this somewhere else?
    if ($element.attribs['grouping'] == 'off'){
        this.role = 'merge'
    }

    return renderElementList(this, $element.children, $scope)
}
