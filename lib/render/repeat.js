import Promise from 'bluebird'

import {
    render, renderElementList
}
from './render'

export default function repeat(render, element, scope) {

    if ('n' in element.attribs) {

        console.log('repeating')

        let n = scope.resolve(element.attribs['n'])

        let solid = scope.solid
        solid.role = 'merge'

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

        let name = element.attribs['each']

        let vs = scope.resolve('{{' + element.attribs['in'] + '}}')

        var contents = vs.map(v => {

            scope.parameters[name] = v

            return render(element.children, scope)

        })

        return Promise.all(contents)

    }

}
