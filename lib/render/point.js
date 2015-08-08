export default function render_point($scope) {

    let x = $scope.resolve(this.src.attribs['x']) || 0
    let y = $scope.resolve(this.src.attribs['y']) || 0
    let z = $scope.resolve(this.src.attribs['z']) || 0

    this.role = "1d"
    this.translateTo(x,y,z)
}
