import _ from 'lodash'
export function fit(newSize) {
    var oldSize = this.size
    var ratios = [newSize.x / oldSize.x, newSize.y / oldSize.y, newSize.z / oldSize.z]
    var ratio = _.min(ratios)
    this.scale(ratio)
}
