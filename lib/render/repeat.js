import Promise from 'bluebird'
import _ from 'lodash'

import {
    render, renderElementList
}
from './render'

export default function repeat(render, element, scope) {

    let solid = scope.solid
    scope.solid.role = 'merge'

    console.log('repeating', element.attribs)

    if ('n' in element.attribs) {

        let n = scope.resolve(element.attribs['n'])

        return renderElementList(element.children, scope)
            .then(() => {

                // console.log('solids', solids)
                let solids = solid.children
                let m = solids.length


                for (let i = 0; i < n - 1; i++) {

                    // clone each of the first N solids
                    for (let j = 0; j < m; j++) {
                        // console.log(solids[j])
                        let copy = solids[j].clone()
                        solids.push(copy)
                    }
                }

                return solids
            })

    } else if ('each' in element.attribs && 'in' in element.attribs) {

        console.log('repeating each')


        let name = element.attribs['each']
        let expr = element.attribs['in']

        // console.log(expr)

        let vs = scope.resolve(expr)

        // console.log('vs', vs, _.isArray(vs))

        var contents = vs.map(v => {

            scope.parameters[name] = v

            return renderElementList(element.children, scope)

        })

        return Promise.all(contents)

    }

}
