import Promise from 'bluebird'
import _ from 'lodash'

import {renderElementList} from './render'

export default function render_repeat($solid, $element, $scope) {

    $solid.role = 'merge'

    if ('n' in $element.attribs) {

        return repeat_n($solid, $element, $scope)

    } else if ('each' in $element.attribs && 'in' in $element.attribs) {

        return repeat_each($solid, $element, $scope)

    }
}

function repeat_n($solid, $element, $scope){

    let n = $scope.resolve($element.attribs['n'])

    return renderElementList($solid, $element.children, $scope)
        .then(() => {

            let solids = $solid.children
            let m = solids.length

            for (let i = 0; i < n - 1; i++) {

                // clone each of the first N solids
                for (let j = 0; j < m; j++) {
                    let copy = solids[j].clone()
                    solids.push(copy)
                }
            }

            return solids
        })
}

function repeat_each($solid, $element, $scope){

    let name = $element.attribs['each']

    let expr = $element.attribs['in']

    let vs = $scope.resolve(expr)

    var contents = vs.map(v => {

        $scope.parameters[name] = v

        return renderElementList($solid, $element.children, $scope)

    })

    return Promise.all(contents)
}
