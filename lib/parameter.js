'strict'

var Element = require('./element')

module.exports = Parameter

function Parameter() {
    Element.apply(this)
}

Parameter.prototype = new Element()
Parameter.prototype.constructor = Parameter