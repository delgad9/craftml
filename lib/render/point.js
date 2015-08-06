export default function render_point($element, $scope) {

    let x = $scope.resolve($element.attribs['x']) || 0
    let y = $scope.resolve($element.attribs['y']) || 0
    let z = $scope.resolve($element.attribs['z']) || 0

    this.role = "1d"
    this.translateTo(x,y,z)
}
