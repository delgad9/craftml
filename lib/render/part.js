var Promise = require("bluebird")

export default function($element, $scope) {
    this.role = 'define'
    $scope.parts[$element.attribs['name']] = $element
}
