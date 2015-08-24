import _ from 'lodash'
import q from '../../query'

import {solidfy_shapes} from '../../render/solidify'

export default function solidify($solid, solids, solidsToSolidify){

    $solid.apply()

    let polygonsToSolidify =
        _.flatten(_.map(solidsToSolidify, s => {
            let $ = q(s)
            if ($(s).is('point, polygon')){  // 'point, polygon' ?? maybe
                return s
            } else {
                return $('polygon').get()
            }
        }))

    // TODO: what if some elements are selected more than once?
    // TODO: what if no solid is selected to solidify

    let result = solidfy_shapes(polygonsToSolidify)

    _.forEach(solidsToSolidify, s => {
        // remove self from parent
        s.parent.remove(s)
    })

    _.forEach(result.children, c => {
        $solid.add(c)

        // the resulting solid will get the style of $solid
        c.applyStyleRecursively($solid.css)
    })

}
