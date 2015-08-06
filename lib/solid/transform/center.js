export function center(loc) {
    var size = this.size
    var newLoc = {
        x: loc.x - size.x/2,
        y: loc.y - size.y/2,
        z: loc.z - size.z/2
    }
    this.translateTo(newLoc)
}
