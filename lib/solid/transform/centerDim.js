export function centerDim(dim, v = 0) {
    var size = this.size
    var v1 = v - size[dim]/2
    this.setDim(dim, v1)
}
