export default function render_point($scope) {

    let x = this.attribs['x'] || 0
    let y = this.attribs['y'] || 0
    let z = this.attribs['z'] || 0

    this.role = "1d"
    this.translateTo(x,y,z)
}
