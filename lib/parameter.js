'strict'

var Element = require('./element')

module.exports = Parameter

function Parameter() {
    this.contents = []
    this.type = 'Parameter'
}

Parameter.prototype = new Element()
Parameter.prototype.constructor = Parameter