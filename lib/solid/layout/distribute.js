import _ from 'lodash'
import lineup from './lineup'

export default function distribute(solids, dim){

    if (solids.length <= 2){
        return
    }

    // sort solids by the target dim
    let sortedSolids = _.sortBy(solids, s => {
            return s.position[dim]
    })

    var totalSize =
        _.sum(_.map(solids, function(solid){
            return solid.size[dim]
        }))


    var n = solids.length
    var last = _.last(sortedSolids)
    var first = sortedSolids[0]

    var max = last.position[dim] + last.size[dim]

    var availableSpace = last.position[dim] + last.size[dim]
        - first.position[dim]

    var spacing = (availableSpace - totalSize) / (n - 1)

    lineup(sortedSolids, dim, spacing, '+')
}
