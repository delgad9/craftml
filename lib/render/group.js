import {renderElementList} from './render'

export default function render_group(element, scope) {
    return renderElementList(element.children, scope)
}
