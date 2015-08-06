export function resize(newSize) {

    var anchorPosition = {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
    }

    var oldSize = this.size
    var ratio = {
        x: newSize.x / oldSize.x,
        y: newSize.y / oldSize.y,
        z: newSize.z / oldSize.z
    }
    this.scale(ratio)
    this.translateTo(anchorPosition)
}
