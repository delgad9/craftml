var Promise = require("bluebird")

export default function($solid, $element, $scope) {
    $scope.parts[$element.attribs['name']] = $element            
}
