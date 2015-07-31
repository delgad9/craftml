import q from '../../query'
import union from '../union'
import _ from 'lodash'

export default function cut($solid, solids, solidsToCut){

    let $ = q(solids[0])

    let csgsToCut =
        _.flatten(_.map(solidsToCut, s => {
            return $(s).find('polyhedron').get()
        }))

    let solidsToCutFrom = _.difference(solids, solidsToCut)
    let csgsToCutFrom =
        _.flatten(_.map(solidsToCutFrom, s => {
            return $(s).find('polyhedron').get()
        }))

    _.remove(csgsToCut, {'role': 'cut'})
    _.remove(csgsToCutFrom, {'role': 'cut'})

    var csg0 = union(_.pluck(csgsToCut,'csg'))
    var csg1 = union(_.pluck(csgsToCutFrom,'csg'))

    var csg = csg1.subtract(csg0)

    let rest = _.difference($solid.children, solidsToCutFrom)

    _.forEach(csgsToCut, r => {
        r.role = 'cut'
    })
    _.forEach(solidsToCut, r => {
        r.role = 'cut'
    })

    // attached the resulting csg to the first selected solid
    // TODO: deal with situations when multiple solids are selected to cut
    let s = solidsToCutFrom[0]
    s.removeAll()
    s.add(csg)
}
