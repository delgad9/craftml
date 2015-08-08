var Promise = require("bluebird")

export default function($scope) {
    this.role = 'define'
    $scope.parts[this.src.attribs.name] = this.src
}
