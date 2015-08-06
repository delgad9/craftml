import _ from 'lodash'
export function resizeDim(dim, v) {
    let newSize = _.clone(this.size)
    newSize[dim] = v
    this.resize(newSize)
}
