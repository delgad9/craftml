import q from '../../query'
import union from '../union'
import _ from 'lodash'

export default function cut(solids, selectors){
    let $ = q(this)

    // console.log('cut', selectors)
    // this.pp()

    let csgsToCut = []
    let csgsToCutFrom = []

    $(this).find(selectors + ' csg').each(function(){
        csgsToCut.push(this)
    })

    let elementsToCut = []
    $(this).find(selectors).each(function(){
        elementsToCut.push(this)
    })

    let elementsToCutFrom = _.difference(solids, elementsToCut)

    _.forEach(elementsToCutFrom, s => {

        $(s).find('csg').each(function(){
            csgsToCutFrom.push(this)
        })

    })

    // console.log('toCutFrom', _.pluck(csgsToCutFrom,'parent.parent.name'))
    // console.log('toCut', _.pluck(csgsToCut,'parent.parent.name'))
    // console.log('cut', csgsToCut.length, 'from', csgsToCutFrom.length)
    // console.log('toCutFrom', _.pluck(elementsToCutFrom,'name'))

    this.apply()

    // console.log(csgsToCut.length)
    // console.log(csgsToCutFrom.length)
    var csg0 = union(_.pluck(csgsToCut,'csg'))
    var csg1 = union(_.pluck(csgsToCutFrom,'csg'))

    // console.log(csg0.polygons.length)
    // console.log(csg1.polygons.length)

    var csg = csg1.subtract(csg0)

    //let rest = _.difference(this.children, _.union(solids, elementsToCut))
    let rest = _.difference(this.children, elementsToCutFrom)

    this.removeAll()
    this.add(csg)
    _.forEach(rest, r => {
        this.add(r)
    })
    _.forEach(csgsToCut, r => {
        r.role = 'cut'
    })
    _.forEach(elementsToCut, r => {
        r.role = 'cut'
    })
}
