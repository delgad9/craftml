import Promise from 'bluebird'
import _ from 'lodash'

import {
    render, renderElementList
}
from './render'

export default function repeat(element, scope) {

    let solid = scope.solid
    scope.solid.role = 'merge'

    if ('n' in element.attribs) {

        let n = scope.resolve(element.attribs['n'])

        return renderElementList(element.children, scope)
            .then(() => {

                let solids = solid.children
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

    } else if ('each' in element.attribs && 'in' in element.attribs) {

        let name = element.attribs['each']

        let expr = element.attribs['in']

        let vs = scope.resolve(expr)

        var contents = vs.map(v => {

            scope.parameters[name] = v

            return renderElementList(element.children, scope)

        })

        return Promise.all(contents)

    }

}
