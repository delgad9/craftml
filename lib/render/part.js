var Promise = require("bluebird")

export default function($solid, $element, $scope) {
    $solid.role = 'define'
    $scope.parts[$element.attribs['name']] = $element
}
