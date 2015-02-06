'strict'

var Element = require('./element')

module.exports = Parameter

function Parameter() {
    this.contents = []
    this.tag = 'Parameter'
}

Parameter.prototype = new Element()
Parameter.prototype.constructor = Parameter