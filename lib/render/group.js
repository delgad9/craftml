import {renderElementList} from './render'

export default function render_group($scope) {
    if (this.src.attribs.grouping == 'off'){
        this.role = 'merge'
    }
    return renderElementList(this, this.src.children, $scope)
}
