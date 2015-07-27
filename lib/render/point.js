export default function render_point($solid, $element, $scope) {

    let x = $scope.resolve($element.attribs['x']) || 0
    let y = $scope.resolve($element.attribs['y']) || 0
    let z = $scope.resolve($element.attribs['z']) || 0

    $solid.role = "1d"
    $solid.translateTo(x,y,z)
}
