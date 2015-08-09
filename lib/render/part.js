var Promise = require("bluebird")

export default function($scope) {
    this.role = 'define'
    console.log(this.src.name)
    $scope.parts[this.src.attribs.name] = this.src
}
