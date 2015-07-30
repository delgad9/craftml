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

    // console.log('toCutFrom', _.pluck(csgsToCutFrom,'parent.parent.name'))
    // console.log('toCut', _.pluck(csgsToCut,'parent.parent.name'))
    // console.log('cut', csgsToCut.length, 'from', csgsToCutFrom.length)
    // console.log('toCutFrom', _.pluck(elementsToCutFrom,'name'))

    var csg0 = union(_.pluck(csgsToCut,'csg'))
    var csg1 = union(_.pluck(csgsToCutFrom,'csg'))

    var csg = csg1.subtract(csg0)

    let rest = _.difference($solid.children, solidsToCutFrom)

    $solid.removeAll()
    $solid.add(csg)
    _.forEach(rest, r => {
        $solid.add(r)
    })
    _.forEach(csgsToCut, r => {
        r.role = 'cut'
    })
    _.forEach(solidsToCut, r => {
        r.role = 'cut'
    })
}
