import _ from 'lodash'
import lineup from './lineup'

export default function distribute(solids, dim){

    if (solids.length <= 2){
        return
    }

    // sort solids by the target dim

    let sortedSolids = _.sortBy(solids, s => {

            return s.layout.position[dim]

    })

    // var z = _.zip(solids, references)
    // var sorted = _.sortBy(z, function(e){
    //     return e[0].layout[dim]
    // })

    // var uz = _.unzip(sorted)
    // var sortedSolids = uz[0]

    var totalSize =
        _.sum(_.map(solids, function(solid){
            return solid.layout.size[dim]
        }))


    var n = solids.length
    var last = _.last(sortedSolids)
    var first = sortedSolids[0]

    var max = last.layout.position[dim] + last.layout.size[dim]


    var availableSpace = last.layout.position[dim] + last.layout.size[dim]
        - first.layout.position[dim]

    var spacing = (availableSpace - totalSize) / (n - 1)

    lineup(sortedSolids, dim, spacing, '+')

}
